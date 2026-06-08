export interface SourceInfo {
  page: number;
  content: string;
  score: number;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceInfo[];
  processingTime?: number;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatRequest {
  query: string;
  session_id?: string;
  top_k?: number;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  query: string;
  response: string;
  sources: SourceInfo[];
  processing_time: number;
}

export interface UploadResponse {
  session_id: string;
  filename: string;
  file_size: number;
  num_chunks: number;
  status: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  gpu_available: boolean;
  pdf_file: string | null;
}

export interface SessionInfo {
  session_id: string;
  filename: string;
  file_size: number;
  num_chunks: number;
  created_at: string;
  ready: boolean;
}

export interface PDFSession {
  sessionId: string;
  filename: string;
  fileSize: number;
  numChunks: number;
  uploadedAt: Date;
}

export type APIStatus = 'idle' | 'loading' | 'ready' | 'error';
