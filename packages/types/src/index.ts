// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Chat Types
export interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  chat_room_id: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

// AI Bot Types
export interface AIBot {
  id: string;
  name: string;
  personality: string;
  description: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
