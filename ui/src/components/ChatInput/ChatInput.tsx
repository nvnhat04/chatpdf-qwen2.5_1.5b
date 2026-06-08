'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  isLoading,
  disabled,
  placeholder = 'Nhập câu hỏi về nội dung PDF...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={styles.container}>
      <div className={`${styles.inputBox} ${disabled ? styles.disabledBox : ''}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Vui lòng upload PDF trước...' : placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={styles.textarea}
          id="chat-input"
          aria-label="Chat input"
        />

        <div className={styles.actions}>
          {isLoading ? (
            <button className={styles.stopBtn} aria-label="Đang xử lý...">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`${styles.sendBtn} ${canSend ? styles.sendActive : ''}`}
              aria-label="Gửi tin nhắn"
              id="send-message-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className={styles.hint}>
        <kbd>Enter</kbd> để gửi · <kbd>Shift+Enter</kbd> xuống dòng
      </p>
    </div>
  );
}
