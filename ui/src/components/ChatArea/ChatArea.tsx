'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import MessageBubble from '@/components/MessageBubble/MessageBubble';
import styles from './ChatArea.module.css';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  hasSession: boolean;
}

function TypingIndicator() {
  return (
    <div className={styles.typingWrapper}>
      <div className={styles.typingAvatar}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8.5" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="15.5" cy="10" r="1.5" fill="currentColor"/>
        </svg>
      </div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className={styles.welcome}>
      <div className={styles.welcomeIcon}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className={styles.welcomeTitle}>Chào mừng đến với ChatPDF</h2>
      <p className={styles.welcomeDesc}>
        Upload file PDF của bạn và đặt câu hỏi.<br />
        Mô hình Qwen2.5-1.5B sẽ phân tích và trả lời dựa trên nội dung tài liệu.
      </p>
      <div className={styles.features}>
        {[
          { icon: '🔍', title: 'RAG Retrieval', desc: 'Tìm kiếm ngữ nghĩa chính xác' },
          { icon: '⚡', title: 'GPU Accelerated', desc: 'Phản hồi nhanh chóng' },
          { icon: '📄', title: 'Multi-chunk', desc: 'Phân tích toàn bộ tài liệu' },
        ].map((f, i) => (
          <div key={i} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <strong className={styles.featureTitle}>{f.title}</strong>
            <span className={styles.featureDesc}>{f.desc}</span>
          </div>
        ))}
      </div>
      <div className={styles.arrow}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Bắt đầu bằng cách upload PDF từ thanh bên trái
      </div>
    </div>
  );
}

export default function ChatArea({ messages, isLoading, hasSession }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className={styles.chatArea}>
      {messages.length === 0 ? (
        <WelcomeScreen />
      ) : (
        <div className={styles.messageList}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
