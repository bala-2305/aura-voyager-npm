import {
  AuraVoyagerConfig,
  Message,
  ConversationContext
} from './types';
import { MemoryManager } from './memory';
import { APIClient } from '../utils/api';
import { AuraVoyagerError, ErrorCodes } from '../utils/errors';

/**
 * Main AuraVoyager class - Core AI agent SDK
 */
export class AuraVoyager {
  private config: AuraVoyagerConfig;
  private memoryManager: MemoryManager;
  private apiClient: APIClient;
  private context: ConversationContext;
  private isInitialized: boolean = false;

  /**
   * Initialize AuraVoyager with configuration
   * @param config Configuration object with apiKey and optional settings
   * @example
   * const agent = new AuraVoyager({
   *   apiKey: 'sk-...',
   *   model: 'gpt-4'
   * });
   */
  constructor(config: AuraVoyagerConfig) {
    if (!config.apiKey) {
      throw new AuraVoyagerError(
        ErrorCodes.INVALID_CONFIG,
        'API key is required in configuration'
      );
    }

    const provider = config.provider || 'openai';
    const isNvidia = provider === 'nvidia';

    this.config = {
      provider,
      apiEndpoint: isNvidia ? 'https://integrate.api.nvidia.com/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions',
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      systemPrompt:
        'You are a helpful, harmless, and honest AI assistant. Provide clear and concise responses.',
      model: isNvidia ? 'meta/llama3-70b-instruct' : 'gpt-3.5-turbo',
      ...config
    };

    this.context = {
      sessionId: this.generateSessionId()
    };

    this.memoryManager = new MemoryManager({
      enabled: true,
      maxMessages: 100,
      persistToLocalStorage: false
    });

    this.apiClient = new APIClient(this.config.apiKey, this.config.apiEndpoint, {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      timeout: this.config.timeout
    });

    this.isInitialized = true;
  }

  /**
   * Send a message and get AI response
   * @param prompt User message/prompt
   * @returns Promise with AI response
   * @example
   * const response = await agent.ask('What is the capital of France?');
   * console.log(response); // "The capital of France is Paris."
   */
  async ask(prompt: string): Promise<string> {
    if (!prompt.trim()) {
      throw new AuraVoyagerError(
        ErrorCodes.INVALID_REQUEST,
        'Prompt cannot be empty'
      );
    }

    // Add user message to memory
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    this.memoryManager.addMessage(userMessage);

    try {
      // Get system message with context
      const systemMessage = this.memoryManager.buildSystemMessage() ||
        this.config.systemPrompt ||
        'You are a helpful AI assistant.';

      let response: string;

      // Use mock API if key is 'mock'
      if (this.config.apiKey === 'mock') {
        response = await APIClient.mockResponse(prompt);
      } else {
        // Use real API
        const messages = this.memoryManager.getMessages();
        response = await this.apiClient.sendMessage(
          messages,
          systemMessage,
          this.config.model
        );
      }

      // Add AI response to memory
      const aiMessage: Message = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      this.memoryManager.addMessage(aiMessage);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send a message and stream the AI response chunks
   * @param prompt User message/prompt
   * @param onChunk Callback called with the growing full response string
   * @returns Promise resolving to the final complete response
   */
  async askStream(prompt: string, onChunk: (text: string) => void): Promise<string> {
    if (!prompt.trim()) {
      throw new AuraVoyagerError(
        ErrorCodes.INVALID_REQUEST,
        'Prompt cannot be empty'
      );
    }

    // Add user message to memory
    const userMessage: Message = {
      id: this.generateMessageId(),
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    this.memoryManager.addMessage(userMessage);

    try {
      // Get system message with context
      const systemMessage = this.memoryManager.buildSystemMessage() ||
        this.config.systemPrompt ||
        'You are a helpful AI assistant.';

      let finalResponse: string;

      // Use mock API if key is 'mock'
      if (this.config.apiKey === 'mock') {
         finalResponse = await APIClient.mockResponse(prompt, onChunk);
      } else {
        const messages = this.memoryManager.getMessages();
        // The messages array still includes the last user message added above
        // Exclude system message from getMessages if any? MemoryManager already does not return system.
        finalResponse = await this.apiClient.streamMessage(
          messages,
          systemMessage,
          this.config.model,
          onChunk
        );
      }

      // Add AI response to memory
      const aiMessage: Message = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: finalResponse,
        timestamp: Date.now()
      };
      this.memoryManager.addMessage(aiMessage);

      return finalResponse;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enable or disable memory/chat history
   * @param enabled Whether to enable memory
   * @example
   * agent.setMemory(false); // Disable chat history
   */
  setMemory(enabled: boolean): void {
    this.memoryManager.setEnabled(enabled);
  }

  /**
   * Set context for the conversation
   * @param context Context information for the AI
   * @example
   * agent.setContext('User is a software developer with 5 years of experience');
   */
  setContext(context: string): void {
    this.memoryManager.setContext(context);
  }

  /**
   * Get all messages from chat history
   * @returns Array of messages
   */
  getMessages(): Message[] {
    return this.memoryManager.getMessages();
  }

  /**
   * Get recent messages
   * @param limit Number of recent messages to retrieve
   * @returns Array of recent messages
   */
  getRecentMessages(limit: number = 10): Message[] {
    return this.memoryManager.getRecentMessages(limit);
  }

  /**
   * Get current context
   * @returns Current context string
   */
  getContext(): string {
    return this.memoryManager.getContext();
  }

  /**
   * Clear chat history
   * @example
   * agent.clearHistory(); // Clear all messages and context
   */
  clearHistory(): void {
    this.memoryManager.clear();
  }

  /**
   * Set user ID for the session
   * @param userId User identifier
   */
  setUserId(userId: string): void {
    this.context.userId = userId;
  }

  /**
   * Get session ID
   * @returns Current session ID
   */
  getSessionId(): string {
    return this.context.sessionId;
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  getConfig(): AuraVoyagerConfig {
    return { ...this.config };
  }

  /**
   * Get memory statistics
   * @returns Memory usage statistics
   */
  getStats() {
    return this.memoryManager.getStats();
  }

  /**
   * Check if SDK is initialized
   * @returns Initialization status
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
