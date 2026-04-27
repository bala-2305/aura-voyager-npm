import {
  AuraVoyagerConfig,
  Message,
  ConversationContext
} from './types';
import { MemoryManager } from './memory';
import { APIClient } from '../utils/api';
import { AuraVoyagerError, ErrorCodes } from '../utils/errors';

/** Default models per provider */
const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-3.5-turbo',
  anthropic: 'claude-3-haiku-20240307',
  gemini: 'gemini-pro',
  groq: 'llama3-8b-8192',
  cohere: 'command-r',
  nvidia: 'meta/llama3-70b-instruct',
  mock: 'mock'
};

/** Default endpoints per provider */
const DEFAULT_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  cohere: 'https://api.cohere.ai/v1/chat',
  nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
  mock: 'mock'
};

/**
 * Main AuraVoyager class - Core AI agent SDK
 */
export class AuraVoyager {
  private config: Required<Pick<AuraVoyagerConfig, 'apiKey' | 'provider' | 'apiEndpoint' | 'maxRetries' | 'retryDelay' | 'timeout' | 'systemPrompt' | 'model'>> & AuraVoyagerConfig;
  private memoryManager: MemoryManager;
  private apiClient: APIClient;
  private context: ConversationContext;

  /**
   * Initialize AuraVoyager with configuration
   * @param config Configuration object with apiKey and optional settings
   * @example
   * const agent = new AuraVoyager({ apiKey: 'sk-...', model: 'gpt-4' });
   */
  constructor(config: AuraVoyagerConfig) {
    if (!config.apiKey) {
      throw new AuraVoyagerError(ErrorCodes.INVALID_CONFIG, 'API key is required in configuration');
    }

    const provider = config.provider || 'openai';

    this.config = {
      provider,
      apiEndpoint: config.apiEndpoint || DEFAULT_ENDPOINTS[provider] || DEFAULT_ENDPOINTS.openai,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
      systemPrompt: config.systemPrompt || 'You are a helpful, harmless, and honest AI assistant. Provide clear and concise responses.',
      model: config.model || DEFAULT_MODELS[provider] || DEFAULT_MODELS.openai,
      ...config
    };

    this.context = { sessionId: this.generateSessionId() };

    this.memoryManager = new MemoryManager({
      enabled: true,
      maxMessages: 100,
      persistToLocalStorage: this.config.persist ?? false,
      storageKey: this.config.storageKey,
      systemPrompt: this.config.systemPrompt
    });

    this.apiClient = new APIClient(this.config.apiKey, this.config.apiEndpoint, {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      timeout: this.config.timeout,
      provider: this.config.provider
    });
  }

  /**
   * Send a message and get AI response (non-streaming)
   */
  async ask(prompt: string): Promise<string> {
    if (!prompt.trim()) {
      throw new AuraVoyagerError(ErrorCodes.INVALID_REQUEST, 'Prompt cannot be empty');
    }

    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    this.memoryManager.addMessage(userMessage);

    const systemMessage = this.memoryManager.buildSystemMessage();
    let response: string;

    if (this.config.apiKey === 'mock') {
      response = await APIClient.mockResponse(prompt);
    } else {
      response = await this.apiClient.sendMessage(
        this.memoryManager.getMessages(),
        systemMessage,
        this.config.model
      );
    }

    this.memoryManager.addMessage({
      id: this.generateMessageId(),
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * Send a message and stream the AI response chunks
   * @param prompt User message/prompt
   * @param onChunk Callback called with the growing accumulated response
   * @returns Promise resolving to the final complete response
   */
  async askStream(prompt: string, onChunk: (text: string) => void): Promise<string> {
    if (!prompt.trim()) {
      throw new AuraVoyagerError(ErrorCodes.INVALID_REQUEST, 'Prompt cannot be empty');
    }

    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    this.memoryManager.addMessage(userMessage);

    const systemMessage = this.memoryManager.buildSystemMessage();
    let finalResponse: string;

    if (this.config.apiKey === 'mock') {
      finalResponse = await APIClient.mockResponse(prompt, onChunk);
    } else {
      finalResponse = await this.apiClient.streamMessage(
        this.memoryManager.getMessages(),
        systemMessage,
        this.config.model,
        onChunk
      );
    }

    this.memoryManager.addMessage({
      id: this.generateMessageId(),
      role: 'assistant',
      content: finalResponse,
      timestamp: Date.now()
    });

    return finalResponse;
  }

  /**
   * Abort any in-progress stream request
   */
  abort(): void {
    this.apiClient.abort();
  }

  /** Enable or disable memory/chat history */
  setMemory(enabled: boolean): void {
    this.memoryManager.setEnabled(enabled);
  }

  /** Set context appended to every system message */
  setContext(context: string): void {
    this.memoryManager.setContext(context);
  }

  /** Override the system prompt at runtime */
  setSystemPrompt(prompt: string): void {
    this.memoryManager.setSystemPrompt(prompt);
  }

  /** Get all messages from chat history */
  getMessages(): Message[] {
    return this.memoryManager.getMessages();
  }

  /** Get N most recent messages */
  getRecentMessages(limit: number = 10): Message[] {
    return this.memoryManager.getRecentMessages(limit);
  }

  /** Get current context string */
  getContext(): string {
    return this.memoryManager.getContext();
  }

  /** Clear all chat history and context */
  clearHistory(): void {
    this.memoryManager.clear();
  }

  /** Set user ID for the session */
  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  /** Get session ID */
  getSessionId(): string {
    return this.context.sessionId;
  }

  /** Get current configuration (read-only copy) */
  getConfig(): AuraVoyagerConfig {
    return { ...this.config };
  }

  /** Get memory statistics */
  getStats() {
    return this.memoryManager.getStats();
  }

  /** Check if SDK is ready */
  isReady(): boolean {
    return true;
  }

  /**
   * Generate text embeddings
   */
  async embed(input: string | string[]): Promise<number[][]> {
    if (this.config.apiKey === 'mock') {
      return [new Array(1536).fill(0).map(() => Math.random())];
    }
    if (this.config.provider !== 'openai') {
      throw new AuraVoyagerError(
        ErrorCodes.INVALID_REQUEST,
        `Embeddings are not yet supported for provider: ${this.config.provider}`
      );
    }
    return this.apiClient.createEmbedding(input, 'text-embedding-3-small');
  }

  /**
   * Generate an image from a text prompt
   */
  async generateImage(prompt: string, size: string = '1024x1024'): Promise<string> {
    if (this.config.apiKey === 'mock') {
      return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/1024/1024`;
    }
    if (this.config.provider !== 'openai') {
      throw new AuraVoyagerError(
        ErrorCodes.INVALID_REQUEST,
        `Image generation is not yet supported for provider: ${this.config.provider}`
      );
    }
    return this.apiClient.createImage(prompt, size);
  }

  /** Generate unique message ID using crypto if available */
  private generateMessageId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `msg_${crypto.randomUUID()}`;
    }
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /** Generate unique session ID */
  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `session_${crypto.randomUUID()}`;
    }
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
