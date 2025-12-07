'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { MessageBubble } from './components/MessageBubble';
import styles from './page.module.css';

export default function Home() {
  const { messages, isLoading, sendMessage } = useChat();
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

    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
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
            <h1>Hello, I'm Gemma.</h1>
            <p>I'm running locally on your machine. Ask me anything!</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble key={index} role={msg.role} content={msg.content} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && ( // Show loading indicator if AI hasn't responded yet
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
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!inputValue.trim() || isLoading}
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
        </form>
      </div>
    </main>
  );
}
