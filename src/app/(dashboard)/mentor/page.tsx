'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import ChatInterface from '@/components/mentor/ChatInterface';
import type { ChatMessage } from '@/types';

export default function MentorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const supabase = createClient();

  // Load chat history from Supabase
  const loadChatHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      if (data) {
        setMessages(data.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        })));
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }, [supabase]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  const saveChatMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('chat_history').insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');

    // Save user message to Supabase
    await saveChatMessage('user', content);

    try {
      const response = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Ignore parse errors from SSE
              }
            }
          }
        }
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');

      // Save assistant message to Supabase
      await saveChatMessage('assistant', fullContent);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
          AI Mentor
        </h1>
        <p className="text-sm text-[#8888AA] mt-1">
          Your personal crypto trading mentor powered by AI
        </p>
      </div>
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingContent={streamingContent}
      />
    </div>
  );
}
