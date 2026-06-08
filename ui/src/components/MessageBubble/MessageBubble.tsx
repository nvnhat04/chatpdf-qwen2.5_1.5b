'use client';

import { useState } from 'react';
import { ChatMessage } from '@/types';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className={`${styles.wrapper} ${isUser ? styles.userWrapper : styles.assistantWrapper}`}>
      {/* Avatar */}
      <div className={`${styles.avatar} ${isUser ? styles.userAvatar : styles.assistantAvatar}`}>
        {isUser ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8.5" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="15.5" cy="10" r="1.5" fill="currentColor"/>
          </svg>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.role}>{isUser ? 'Bạn' : 'ChatPDF · Qwen2.5'}</span>
          <span className={styles.time}>{formatTime(message.timestamp)}</span>
          {message.processingTime && (
            <span className={styles.processingTime}>
              {message.processingTime.toFixed(2)}s
            </span>
          )}
        </div>

        <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
          {message.isStreaming ? (
            <div className={styles.streamingContent}>
              <span>{message.content}</span>
              <span className={styles.cursor} />
            </div>
          ) : (
            <div className={styles.text}>{message.content}</div>
          )}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className={styles.sourcesSection}>
            <button
              className={styles.sourcesToggle}
              onClick={() => setShowSources(!showSources)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {message.sources.length} nguồn tham khảo
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                style={{ transform: showSources ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showSources && (
              <div className={styles.sourcesList}>
                {message.sources.map((src, i) => (
                  <div key={i} className={styles.sourceItem}>
                    <div className={styles.sourceHeader}>
                      <span className={styles.sourceTag}>Trang {src.page}</span>
                      <span className={styles.sourceScore}>
                        {(src.relevance * 100).toFixed(0)}% phù hợp
                      </span>
                    </div>
                    <p className={styles.sourceContent}>{src.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
