import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatPDF - UET | Qwen2.5-1.5B',
  description: 'Hệ thống hỏi đáp tài liệu PDF thông minh sử dụng mô hình Qwen2.5-1.5B và RAG pipeline. Được phát triển tại UET.',
  keywords: ['chatpdf', 'qwen', 'rag', 'uet', 'pdf chatbot', 'ai'],
  authors: [{ name: 'UET' }],
  openGraph: {
    title: 'ChatPDF - UET',
    description: 'Hỏi đáp tài liệu PDF thông minh với Qwen2.5-1.5B',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
