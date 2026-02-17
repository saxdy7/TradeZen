import { NextRequest } from 'next/server';
import { groq, SYSTEM_PROMPT } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-20), // Keep last 20 messages for context
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
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
