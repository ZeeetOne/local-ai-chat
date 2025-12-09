import { useState, useEffect, useCallback } from 'react';
import { Message } from './useChat';

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    preview: string;
    messages: Message[];
}

const STORAGE_KEY = 'chat_history';

export function useChatHistory() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);

    // Load from localStorage on mount (client-side only)
    // This is intentional - we need to hydrate state from localStorage after mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSessions(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
    }, []);

    // Save sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const saveSession = useCallback((id: string, messages: Message[]) => {
        if (messages.length === 0) return;

        setSessions(prev => {
            const existingIndex = prev.findIndex(s => s.id === id);
            const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
            const preview = messages[messages.length - 1].content.slice(0, 50) + (messages[messages.length - 1].content.length > 50 ? '...' : '');
            const now = Date.now();

            if (existingIndex >= 0) {
                // Update existing session, keep original createdAt
                const newSessions = [...prev];
                newSessions[existingIndex] = {
                    ...newSessions[existingIndex],
                    title,
                    updatedAt: now,
                    preview,
                    messages
                };
                return newSessions;
            } else {
                // New session - createdAt determines order
                const newSession: ChatSession = {
                    id,
                    title,
                    createdAt: now,
                    updatedAt: now,
                    preview,
                    messages
                };
                // Insert at top (newest first by creation time)
                return [newSession, ...prev];
            }
        });
    }, []);

    const deleteSession = useCallback((id: string) => {
        setSessions(prev => {
            const newSessions = prev.filter(s => s.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions)); // Force save for deletion
            return newSessions;
        });
    }, []);

    return {
        sessions,
        saveSession,
        deleteSession
    };
}
