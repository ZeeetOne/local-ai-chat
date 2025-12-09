'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChat, Message } from './hooks/useChat';
import { useChatHistory } from './hooks/useChatHistory';
import { MessageBubble } from './components/MessageBubble';
import { Sidebar } from './components/Sidebar';
import styles from './page.module.css';

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Stable empty array to avoid re-renders
const EMPTY_MESSAGES: Message[] = [];

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { sessions, saveSession, deleteSession } = useChatHistory();

  // Get initial messages for the current session (only when session ID changes)
  const initialMessages = useMemo(() => {
    if (!currentSessionId) return EMPTY_MESSAGES;
    const session = sessions.find(s => s.id === currentSessionId);
    return session?.messages ?? EMPTY_MESSAGES;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]); // Intentionally exclude sessions to avoid re-triggering on save

  // Use a ref for currentSessionId to avoid recreating the callback
  const currentSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Callback to save messages when they change
  const handleMessagesChange = useCallback((messages: Message[]) => {
    if (currentSessionIdRef.current && messages.length > 0) {
      saveSession(currentSessionIdRef.current, messages);
    }
  }, [saveSession]);

  const { messages, isLoading, sendMessage, cancelGeneration, clearMessages } = useChat({
    initialMessages,
    onMessagesChange: handleMessagesChange,
  });

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Create a new session if we don't have one
    if (!currentSessionId) {
      const newSessionId = generateSessionId();
      setCurrentSessionId(newSessionId);
      currentSessionIdRef.current = newSessionId; // Update ref immediately
    }

    sendMessage(inputValue);
    setInputValue('');
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    clearMessages();
  };

  const handleSelectSession = (id: string) => {
    if (isLoading) {
      cancelGeneration();
    }
    setCurrentSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      clearMessages();
    }
  };

  return (
    <div className={styles.layout}>
      {sidebarOpen && (
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />
      )}
      <main className={styles.main}>
        <header className={styles.header}>
          <button
            className={styles.menuButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Local Gemma Chat</div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Running on Ollama</div>
        </header>

        <div className={styles.chatContainer}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              marginTop: '20vh',
              color: '#666',
              padding: '0 2rem'
            }}>
              <h1>Hello, I&apos;m Gemma.</h1>
              <p>I&apos;m running locally on your machine. Ask me anything!</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <MessageBubble key={index} role={msg.role} content={msg.content} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className={styles.loadingWrapper} style={{ padding: '1rem' }}>
              <span style={{ color: '#666' }}>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <form onSubmit={handleSubmit} className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.input}
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            {isLoading ? (
              <button
                type="button"
                className={styles.cancelButton}
                onClick={cancelGeneration}
                aria-label="Cancel generation"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className={styles.sendButton}
                disabled={!inputValue.trim()}
                aria-label="Send message"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
