import React from 'react';
import styles from './Sidebar.module.css';
import { ChatSession } from '../hooks/useChatHistory';

interface SidebarProps {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
}

export function Sidebar({ sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession }: SidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <button className={styles.newChatButton} onClick={onNewChat}>
                    <span>+</span> New Chat
                </button>
            </div>
            <div className={styles.sessionList}>
                {sessions.map((session) => (
                    <button
                        key={session.id}
                        className={`${styles.sessionItem} ${session.id === currentSessionId ? styles.active : ''}`}
                        onClick={() => onSelectSession(session.id)}
                    >
                        <span className={styles.sessionTitle}>{session.title || 'Untitled Chat'}</span>
                        <span className={styles.sessionPreview}>{session.preview}</span>
                        <div
                            className={styles.deleteButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                            title="Delete Chat"
                        >
                            ×
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}
