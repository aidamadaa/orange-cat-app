
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isError?: boolean;
  sources?: { title: string; uri: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ms' | 'zh' | 'ta' | 'id';

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}