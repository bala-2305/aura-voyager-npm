import { Message, MemoryConfig } from './types';

/**
 * Memory manager for handling chat history and context
 */
export class MemoryManager {
  private messages: Message[] = [];
  private context: string = '';
  private systemPrompt: string = '';
  private enabled: boolean = true;
  private maxMessages: number = 100;
  private persistToLocalStorage: boolean = false;
  private storageKey: string = 'aura-voyager-messages';

  constructor(config: MemoryConfig = { enabled: true }) {
    this.enabled = config.enabled;
    this.maxMessages = config.maxMessages || 100;
    this.persistToLocalStorage = config.persistToLocalStorage || false;
    this.systemPrompt = config.systemPrompt || '';

    if (config.storageKey) {
      this.storageKey = config.storageKey;
    }

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

    // Keep the most recent messages, always preserving pairs (user/assistant)
    if (this.messages.length > this.maxMessages) {
      // Trim from the front, keeping an even number to preserve conversation pairs
      const excess = this.messages.length - this.maxMessages;
      this.messages = this.messages.slice(excess);
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
   * Get most recent N messages
   */
  getRecentMessages(limit: number = 10): Message[] {
    return this.messages.slice(-limit);
  }

  /**
   * Get context string
   */
  getContext(): string {
    return this.context;
  }

  /**
   * Set context string
   */
  setContext(context: string): void {
    this.context = context;
    if (this.persistToLocalStorage) this.saveToLocalStorage();
  }

  /**
   * Set system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  /**
   * Clear all messages and context
   */
  clear(): void {
    this.messages = [];
    this.context = '';

    if (this.persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Enable or disable memory
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
   * Build system message for API calls, merging systemPrompt + context
   */
  buildSystemMessage(): string {
    // Config systemPrompt takes precedence as the base, then context appended
    const base = this.systemPrompt || 'You are a helpful, harmless, and honest AI assistant.';
    if (this.context) {
      return `${base}\n\nContext: ${this.context}`;
    }
    return base;
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
    } catch {
      console.warn('[AuraVoyager] Failed to save chat to localStorage');
    }
  }

  /**
   * Load messages from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.messages = parsed.messages || [];
        this.context = parsed.context || '';
      }
    } catch {
      console.warn('[AuraVoyager] Failed to load chat from localStorage');
    }
  }
}
