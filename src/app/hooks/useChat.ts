import { useState, useCallback, useRef, useEffect } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface UseChatOptions {
    initialMessages?: Message[];
    onMessagesChange?: (messages: Message[]) => void;
}

export function useChat(options: UseChatOptions = {}) {
    const { initialMessages, onMessagesChange } = options;
    const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const onMessagesChangeRef = useRef(onMessagesChange);
    const prevInitialMessagesRef = useRef(initialMessages);

    // Keep the callback ref updated
    useEffect(() => {
        onMessagesChangeRef.current = onMessagesChange;
    }, [onMessagesChange]);

    // Update messages only when initialMessages actually changes (by reference)
    // This handles loading a different session
    useEffect(() => {
        if (initialMessages !== prevInitialMessagesRef.current) {
            prevInitialMessagesRef.current = initialMessages;
            setMessages(initialMessages ?? []);
        }
    }, [initialMessages]);

    // Notify parent when messages change
    // Use a ref to avoid calling onMessagesChange on every render
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    });

    useEffect(() => {
        if (messages.length > 0 && messages !== initialMessages) {
            onMessagesChangeRef.current?.(messages);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

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
                                if (lastMsg && lastMsg.role === 'assistant') {
                                    lastMsg.content = assistantMessage;
                                }
                                return newMessages;
                            });
                        }
                    } catch (e) {
                        console.error("Error parsing chunk", e);
                    }
                }
            }

        } catch (error: unknown) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Chat error:', error);
                setMessages((prev) => {
                    // Only add error message if we still have messages (not cleared)
                    if (prev.length > 0) {
                        return [...prev, { role: 'assistant', content: 'Sorry, something went wrong.' }];
                    }
                    return prev;
                });
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [messages]);

    const cancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    }, []);

    const clearMessages = useCallback(() => {
        // Abort any ongoing generation before clearing
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
        setMessages([]);
    }, []);

    return {
        messages,
        isLoading,
        sendMessage,
        cancelGeneration,
        clearMessages,
    };
}
