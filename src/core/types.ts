/**
 * Core types and interfaces for Aura Voyager SDK
 */

/**
 * Message object representing a single conversation message
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Configuration for AuraVoyager SDK
 */
export interface AuraVoyagerConfig {
  apiKey: string;
  apiEndpoint?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  systemPrompt?: string;
  model?: string;
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  enabled: boolean;
  maxMessages?: number;
  persistToLocalStorage?: boolean;
}

/**
 * API response structure for chat completions
 */
export interface APIResponse {
  success: boolean;
  data?: {
    content: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Context object for conversation
 */
export interface ConversationContext {
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}
