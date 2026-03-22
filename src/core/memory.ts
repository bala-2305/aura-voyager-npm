import { Message, MemoryConfig } from './types';

/**
 * Memory manager for handling chat history and context
 */
export class MemoryManager {
  private messages: Message[] = [];
  private context: string = '';
  private enabled: boolean = true;
  private maxMessages: number = 100;
  private persistToLocalStorage: boolean = false;
  private storageKey: string = 'aura-voyager-messages';

  constructor(config: MemoryConfig = { enabled: true }) {
    this.enabled = config.enabled;
    this.maxMessages = config.maxMessages || 100;
    this.persistToLocalStorage = config.persistToLocalStorage || false;

    if (this.persistToLocalStorage && typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Add a message to memory
   */
  addMessage(message: Message): void {
    if (!this.enabled) return;

    this.messages.push(message);

    // Maintain max message limit
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    if (this.persistToLocalStorage) {
      this.saveToLocalStorage();
    }
  }

  /**
   * Get all messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get messages with limit
   */
  getRecentMessages(limit: number = 10): Message[] {
    return this.messages.slice(-limit);
  }

  /**
   * Get context
   */
  getContext(): string {
    return this.context;
  }

  /**
   * Set context
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
    this.context = '';

    if (this.persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Enable/disable memory
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if memory is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get memory statistics
   */
  getStats(): { messageCount: number; contextLength: number } {
    return {
      messageCount: this.messages.length,
      contextLength: this.context.length
    };
  }

  /**
   * Build system message for API calls
   */
  buildSystemMessage(): string {
    let system = 'You are a helpful AI assistant.';

    if (this.context) {
      system += `\n\nContext: ${this.context}`;
    }

    return system;
  }

  /**
   * Save messages to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        messages: this.messages,
        context: this.context,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load messages from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.messages = parsed.messages || [];
        this.context = parsed.context || '';
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }
}
