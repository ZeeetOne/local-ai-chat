import { useState, useCallback, useRef } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        // Add user message immediately
        const userMessage: Message = { role: 'user', content };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage], // Send history + new message
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            if (!response.body) return;

            // Create placeholder for AI response
            setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                // The last element might be an incomplete JSON object, so we keep it in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            const contentChunk = json.message.content;
                            assistantMessage += contentChunk;

                            setMessages((prev) => {
                                const newMessages = [...prev];
                                const lastMsg = newMessages[newMessages.length - 1];
                                if (lastMsg.role === 'assistant') {
                                    lastMsg.content = assistantMessage;
                                }
                                return newMessages;
                            });
                        }
                        if (json.done) {
                            // Stream finished
                        }
                    } catch (e) {
                        console.error("Error parsing chunk", e);
                    }
                }
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Chat error:', error);
                setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }]);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [messages]);

    return {
        messages,
        isLoading,
        sendMessage,
    };
}
