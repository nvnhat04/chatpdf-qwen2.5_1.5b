'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, PDFSession, HealthResponse } from '@/types';
import { chatAPI } from '@/services/api';
import Sidebar from '@/components/Sidebar/Sidebar';
import ChatArea from '@/components/ChatArea/ChatArea';
import ChatInput from '@/components/ChatInput/ChatInput';
import styles from './page.module.css';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<PDFSession | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatpdf-theme');
    const initialTheme =
      savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    document.documentElement.dataset.theme = initialTheme;
    const frame = requestAnimationFrame(() => setTheme(initialTheme));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('chatpdf-theme', nextTheme);
      return nextTheme;
    });
  };

  // Health check on mount and periodically
  const checkHealth = useCallback(async () => {
    try {
      const h = await chatAPI.health();
      setHealth(h);
    } catch {
      setHealth(null);
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(checkHealth, 0);
    const interval = setInterval(checkHealth, 30000);
    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [checkHealth]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !currentSession) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatAPI.chat({
        query: text.trim(),
        session_id: currentSession.sessionId,
        top_k: 5,
        max_tokens: 512,
        temperature: 0.7,
      });

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        processingTime: response.processing_time,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Lỗi: ${err instanceof Error ? err.message : 'Không thể kết nối tới server'}. Vui lòng kiểm tra API server đang chạy tại http://localhost:8000`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for suggested questions from sidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const question = (e as CustomEvent<string>).detail;
      handleSendMessage(question);
    };
    window.addEventListener('suggested-question', handler);
    return () => window.removeEventListener('suggested-question', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession, isLoading]);

  const handleNewChat = () => {
    setMessages([]);
    setIsMobileSidebarOpen(false);
  };

  const handleSessionCreated = (session: PDFSession) => {
    setCurrentSession(session);
    setMessages([]);
  };

  const handleClearSession = () => {
    setCurrentSession(null);
    setMessages([]);
  };

  return (
    <div className={styles.app}>
      <Sidebar
        currentSession={currentSession}
        health={health}
        isCheckingHealth={isCheckingHealth}
        onSessionCreated={handleSessionCreated}
        onClearSession={handleClearSession}
        onNewChat={handleNewChat}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className={styles.main}>
        {/* Mobile header */}
        <header className={styles.mobileHeader}>
          <button
            className={styles.menuBtn}
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
            id="mobile-menu-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <span className={styles.mobileTitle}>ChatPDF · nvnhat04</span>
          <div className={styles.mobileActions}>
            <button
              className={styles.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <span className={`${styles.statusDot} ${health?.status === 'ready' ? styles.dotReady : styles.dotOffline}`} />
          </div>
        </header>

        {/* Chat messages */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          hasSession={!!currentSession}
        />

        {/* Input footer */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            {!currentSession && (
              <div className={styles.noSessionBanner}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Hãy upload một file PDF để bắt đầu trò chuyện
              </div>
            )}
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              disabled={!currentSession || health?.status !== 'ready'}
              placeholder={
                !currentSession
                  ? 'Upload PDF trước để đặt câu hỏi...'
                  : 'Đặt câu hỏi về nội dung PDF...'
              }
            />
          </div>
        </footer>
      </main>
    </div>
  );
}
