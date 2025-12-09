import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        const model = 'gemma2:2b';

        const response = await fetch('http://127.0.0.1:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to communicate with Ollama' },
                { status: response.status }
            );
        }

        if (!response.body) {
            return NextResponse.json({ error: 'No response body from Ollama' }, { status: 500 });
        }

        // Pass the stream directly to the client
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
