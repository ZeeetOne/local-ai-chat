import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ role, content }) => {
    return (
        <div className={`${styles.container} ${role === 'user' ? styles.user : styles.assistant}`}>
            <div className={styles.bubble}>
                {role === 'assistant' ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                    <p>{content}</p>
                )}
            </div>
        </div>
    );
};
