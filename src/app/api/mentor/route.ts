import { NextRequest } from 'next/server';
import { groq, AI_PERSONAS, BASE_RULES } from '@/lib/groq';
import type { AIPersona } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { messages, marketContext, persona, portfolioContext, analysisRequest } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Select persona prompt
    const selectedPersona: AIPersona = persona && AI_PERSONAS[persona as AIPersona] ? persona : 'analyst';
    let systemPrompt = AI_PERSONAS[selectedPersona].prompt + BASE_RULES;

    // Inject live market context
    if (marketContext) {
      systemPrompt += '\n\n' + marketContext + '\nUse this live data to provide current, relevant market analysis when users ask about prices, trends, or which coins to watch.';
    }

    // Inject portfolio context if user enabled it
    if (portfolioContext) {
      systemPrompt += '\n\n[USER PORTFOLIO]\n' + portfolioContext + '\nThe user has shared their portfolio. Reference it when giving personalized advice, portfolio reviews, or rebalancing suggestions.';
    }

    // If this is a quick analysis request, prepend analysis instruction
    const processedMessages = [...messages.slice(-20)];
    if (analysisRequest) {
      processedMessages.push({
        role: 'user' as const,
        content: analysisRequest,
      });
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...processedMessages,
      ],
      stream: true,
      temperature: selectedPersona === 'trader' ? 0.5 : selectedPersona === 'degen' ? 0.8 : 0.7,
      max_tokens: 4096,
    });

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of response) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Mentor API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get AI response' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
