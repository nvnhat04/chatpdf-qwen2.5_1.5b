'use client';

import { HealthResponse } from '@/types';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  health: HealthResponse | null;
  isChecking: boolean;
}

export default function StatusBar({ health, isChecking }: StatusBarProps) {
  const getStatusColor = () => {
    if (isChecking) return 'checking';
    if (!health) return 'offline';
    if (health.status === 'ready') return 'ready';
    return 'loading';
  };

  const getStatusLabel = () => {
    if (isChecking) return 'Đang kết nối...';
    if (!health) return 'Mất kết nối';
    if (health.status === 'ready') return 'Sẵn sàng';
    return 'Đang khởi động...';
  };

  const status = getStatusColor();

  return (
    <div className={styles.statusBar}>
      <div className={`${styles.indicator} ${styles[status]}`} />
      <span className={styles.label}>{getStatusLabel()}</span>
      {health && (
        <>
          <span className={styles.divider}>·</span>
          <span className={styles.meta}>
            {health.gpu_available ? '⚡ GPU' : '💻 CPU'}
          </span>
          <span className={styles.divider}>·</span>
          <span className={styles.meta}>Qwen2.5-1.5B</span>
        </>
      )}
    </div>
  );
}
