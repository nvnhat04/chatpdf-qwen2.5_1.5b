'use client';

import { PDFSession, HealthResponse } from '@/types';
import PDFUploader from '@/components/PDFUploader/PDFUploader';
import StatusBar from '@/components/StatusBar/StatusBar';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentSession: PDFSession | null;
  health: HealthResponse | null;
  isCheckingHealth: boolean;
  onSessionCreated: (session: PDFSession) => void;
  onClearSession: () => void;
  onNewChat: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Tóm tắt nội dung chính của tài liệu',
  'Phương pháp nghiên cứu được sử dụng là gì?',
  'Kết quả và kết luận của nghiên cứu?',
  'Các thuật toán/mô hình nào được đề cập?',
];

export default function Sidebar({
  currentSession,
  health,
  isCheckingHealth,
  onSessionCreated,
  onClearSession,
  onNewChat,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className={styles.overlay} onClick={onCloseMobile} />
      )}

      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.logoTitle}>ChatPDF</h1>
            <p className={styles.logoSub}>UET · Qwen2.5-1.5B</p>
          </div>
        </div>

        {/* New chat button */}
        <button className={styles.newChatBtn} onClick={onNewChat} id="new-chat-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Cuộc hội thoại mới
        </button>

        <div className={styles.divider} />

        {/* PDF section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Tài liệu PDF
          </h2>
          <PDFUploader
            onSessionCreated={onSessionCreated}
            currentSession={currentSession}
            onClearSession={onClearSession}
          />
        </div>

        {/* Suggested questions */}
        {currentSession && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Câu hỏi gợi ý
            </h2>
            <div className={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className={styles.suggestionBtn}
                  onClick={() => {
                    // Emit event to parent
                    window.dispatchEvent(new CustomEvent('suggested-question', { detail: q }));
                    onCloseMobile();
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className={styles.spacer} />

        <div className={styles.divider} />

        {/* Status */}
        <div className={styles.footer}>
          <StatusBar health={health} isChecking={isCheckingHealth} />
          <p className={styles.footerNote}>
            Powered by RAG + Qwen2.5-1.5B
          </p>
        </div>
      </aside>
    </>
  );
}
