'use client';

import { useRef, useState, useCallback } from 'react';
import { PDFSession, UploadResponse } from '@/types';
import { chatAPI } from '@/services/api';
import styles from './PDFUploader.module.css';

interface PDFUploaderProps {
  onSessionCreated: (session: PDFSession) => void;
  currentSession: PDFSession | null;
  onClearSession: () => void;
}

export default function PDFUploader({
  onSessionCreated,
  currentSession,
  onClearSession,
}: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Chỉ chấp nhận file PDF');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File không được vượt quá 50MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 8, 85));
    }, 300);

    try {
      const response: UploadResponse = await chatAPI.uploadPDF(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        onSessionCreated({
          sessionId: response.session_id,
          filename: response.filename,
          fileSize: response.file_size,
          numChunks: response.num_chunks,
          uploadedAt: new Date(),
        });
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Upload thất bại');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onSessionCreated]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  if (currentSession) {
    return (
      <div className={styles.activeSession}>
        <div className={styles.sessionIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.sessionInfo}>
          <p className={styles.sessionName}>{currentSession.filename}</p>
          <p className={styles.sessionMeta}>
            {formatSize(currentSession.fileSize)} · {currentSession.numChunks} đoạn văn
          </p>
        </div>
        <button
          className={styles.changeBtn}
          onClick={onClearSession}
          title="Đổi file PDF"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${isUploading ? styles.uploading : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          id="pdf-upload-input"
        />

        {isUploading ? (
          <div className={styles.uploadingState}>
            <div className={styles.progressRing}>
              <svg viewBox="0 0 36 36" className={styles.progressSvg}>
                <circle className={styles.progressBg} cx="18" cy="18" r="15" />
                <circle
                  className={styles.progressFill}
                  cx="18" cy="18" r="15"
                  strokeDasharray={`${uploadProgress * 0.942} 94.2`}
                />
              </svg>
              <span className={styles.progressText}>{uploadProgress}%</span>
            </div>
            <p className={styles.uploadingText}>Đang xử lý PDF...</p>
            <p className={styles.uploadingSubtext}>Tạo embeddings và index...</p>
          </div>
        ) : (
          <div className={styles.idleState}>
            <div className={styles.uploadIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className={styles.dropText}>
              {isDragging ? 'Thả file vào đây' : 'Kéo thả PDF hoặc click để chọn'}
            </p>
            <p className={styles.dropSubtext}>Tối đa 50MB · Định dạng PDF</p>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMsg}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
