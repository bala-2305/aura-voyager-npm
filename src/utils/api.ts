import { APIResponse, Message } from '../core/types';
import { AuraVoyagerError, ErrorCodes } from './errors';

/**
 * API client for handling requests to AI backend
 */

export class APIClient {
  private apiKey: string;
  private apiEndpoint: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;

  constructor(
    apiKey: string,
    apiEndpoint: string = 'https://api.openai.com/v1/chat/completions',
    options: { maxRetries?: number; retryDelay?: number; timeout?: number } = {}
  ) {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Send message to AI API with retry logic
   */
  async sendMessage(
    messages: Message[],
    systemMessage: string,
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(formattedMessages, model, false);

        if (response.success && response.data?.content) {
          return response.data.content;
        } else if (response.error) {
          throw new AuraVoyagerError(
            response.error.code,
            response.error.message,
            response.error
          );
        } else {
          throw new AuraVoyagerError(
            ErrorCodes.UNKNOWN,
            'Unknown API response'
          );
        }
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new AuraVoyagerError(
      ErrorCodes.API_ERROR,
      'Failed to get response after retries'
    );
  }

  /**
   * Stream message to AI API parsing SSE
   */
  async streamMessage(
    messages: Message[],
    systemMessage: string,
    model: string = 'gpt-3.5-turbo',
    onChunk: (text: string) => void
  ): Promise<string> {
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))
    ];

    let fullResponse = '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true
        }),
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuraVoyagerError(
          ErrorCodes.API_ERROR,
          `API Error: ${response.statusText}`,
          { status: response.status, ...errorData }
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AuraVoyagerError(ErrorCodes.API_ERROR, 'Response body is empty');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const data = JSON.parse(trimmed.substring(6));
              const content = data.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(fullResponse);
              }
            } catch (e) {
              // Ignore invalid JSON in streams
            }
          }
        }
      }

      return fullResponse;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new AuraVoyagerError(
          ErrorCodes.TIMEOUT,
          'Request timeout exceeded'
        );
      }

      if (error instanceof AuraVoyagerError) {
        throw error;
      }

      throw new AuraVoyagerError(
        ErrorCodes.NETWORK_ERROR,
        error.message || 'Stream request failed',
        { originalError: error }
      );
    }
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest(
    messages: any[],
    model: string,
    stream: boolean = false
  ): Promise<APIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream
        }),
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuraVoyagerError(
          ErrorCodes.API_ERROR,
          `API Error: ${response.statusText}`,
          { status: response.status, ...errorData }
        );
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          content: data.choices?.[0]?.message?.content || '',
          model: data.model,
          usage: data.usage
        }
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new AuraVoyagerError(
          ErrorCodes.TIMEOUT,
          'Request timeout exceeded'
        );
      }

      if (error instanceof AuraVoyagerError) {
        throw error;
      }

      throw new AuraVoyagerError(
        ErrorCodes.NETWORK_ERROR,
        error.message || 'Network request failed',
        { originalError: error }
      );
    }
  }

  /**
   * Mock API response for testing (when API key is 'mock')
   */
  static async mockResponse(prompt: string, onChunk?: (text: string) => void): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResponses: Record<string, string> = {
      hello: 'Hello! I\'m Aura Voyager, your AI assistant. How can I help you today?',
      help: 'I can help you with various tasks including answering questions, providing information, and having conversations. What would you like to know?',
      default: `I understand you said: "${prompt}". That's interesting! I'm here to help. What else would you like to discuss?`
    };

    const lowerPrompt = prompt.toLowerCase().trim();
    let result = mockResponses.default;
    for (const [key, response] of Object.entries(mockResponses)) {
      if (lowerPrompt.includes(key)) {
        result = response;
        break;
      }
    }

    if (onChunk) {
      let current = '';
      const words = result.split(' ');
      for (let i = 0; i < words.length; i++) {
        current += (i > 0 ? ' ' : '') + words[i];
        onChunk(current);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return result;
  }
}
