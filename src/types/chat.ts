export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface Experience {
  id?: string;
  title: string;
  city?: string;
  category?: string;
  duration?: string;
  summary?: string;
  url?: string;
  price?: string;
  currency?: string;
  // Flexible content
  photos?: string[];
  videos?: string[];
  schedule?: any;
  source?: string;
  metadata?: Record<string, any>;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}