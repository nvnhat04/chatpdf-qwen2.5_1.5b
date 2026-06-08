import {
  ChatRequest,
  ChatResponse,
  HealthResponse,
  UploadResponse,
  SessionInfo,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const chatAPI = {
  /** Check server health */
  health: (): Promise<HealthResponse> =>
    apiRequest<HealthResponse>('/health'),

  /** Upload a PDF file and create a session */
  uploadPDF: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /** Send a chat message */
  chat: (request: ChatRequest): Promise<ChatResponse> =>
    apiRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  /** Get session info */
  getSession: (sessionId: string): Promise<SessionInfo> =>
    apiRequest<SessionInfo>(`/sessions/${sessionId}`),

  /** Delete a session */
  deleteSession: (sessionId: string): Promise<{ status: string; message: string }> =>
    apiRequest(`/sessions/${sessionId}`, { method: 'DELETE' }),
};
