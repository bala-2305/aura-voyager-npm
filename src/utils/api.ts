import { APIResponse, Message } from '../core/types';
import { AuraVoyagerError, ErrorCodes } from './errors';

/** Options for the API client */
export interface APIClientOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Builds provider-specific headers
 */
function buildHeaders(apiKey: string, provider: string): Record<string, string> {
  if (provider === 'anthropic') {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
}

/**
 * Builds provider-specific request body
 */
function buildBody(
  messages: any[],
  model: string,
  stream: boolean,
  provider: string,
  temperature: number,
  maxTokens: number
): any {
  if (provider === 'anthropic') {
    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const chatMessages = messages.filter(m => m.role !== 'system');
    const body: any = { model, messages: chatMessages, stream, max_tokens: maxTokens };
    if (systemMsg) body.system = systemMsg;
    return body;
  }
  return { model, messages, temperature, max_tokens: maxTokens, stream };
}

/**
 * Extract content from provider-specific non-streaming response
 */
function extractContent(data: any, provider: string): string {
  if (provider === 'anthropic') return data.content?.[0]?.text || '';
  if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Extract content from provider-specific streaming chunk
 */
function extractStreamChunk(data: any, provider: string): string {
  if (provider === 'anthropic') {
    return data.type === 'content_block_delta' ? (data.delta?.text || '') : '';
  }
  return data.choices?.[0]?.delta?.content || '';
}

/**
 * Determine if an HTTP error should be retried
 */
function isRetryableStatus(status: number): boolean {
  // Retry on rate limit (429) and server errors (5xx), not on auth (401) or bad request (400)
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * API client for handling requests to AI backend
 */
export class APIClient {
  private apiKey: string;
  private apiEndpoint: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;
  private provider: string;
  private temperature: number;
  private maxTokens: number;

  /** Active abort controller for the current stream — allows external cancellation */
  private activeController: AbortController | null = null;

  constructor(
    apiKey: string,
    apiEndpoint: string = 'https://api.openai.com/v1/chat/completions',
    options: APIClientOptions = {}
  ) {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.timeout = options.timeout ?? 30000;
    this.provider = options.provider ?? 'openai';
    this.temperature = options.temperature ?? 0.7;
    this.maxTokens = options.maxTokens ?? 2000;
  }

  /**
   * Abort any in-progress stream request
   */
  abort(): void {
    this.activeController?.abort();
    this.activeController = null;
  }

  /**
   * Send message to AI API with smart retry logic (no retry on auth/bad-request errors)
   */
  async sendMessage(
    messages: Message[],
    systemMessage: string,
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }))
    ];

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(formattedMessages, model, false);
        if (response.success && response.data?.content !== undefined) {
          return response.data.content;
        }
        if (response.error) {
          throw new AuraVoyagerError(response.error.code, response.error.message, response.error);
        }
        throw new AuraVoyagerError(ErrorCodes.UNKNOWN, 'Unknown API response');
      } catch (error: any) {
        lastError = error;
        // Don't retry on non-retryable errors
        const status = error?.details?.status;
        if (error instanceof AuraVoyagerError && status && !isRetryableStatus(status)) {
          throw error;
        }
        if (attempt < this.maxRetries) {
          // Exponential backoff with jitter
          const delay = this.retryDelay * Math.pow(2, attempt) + Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new AuraVoyagerError(ErrorCodes.API_ERROR, 'Failed to get response after retries');
  }

  /**
   * Stream message to AI API with buffered SSE parser and abort support
   */
  async streamMessage(
    messages: Message[],
    systemMessage: string,
    model: string = 'gpt-3.5-turbo',
    onChunk: (text: string) => void
  ): Promise<string> {
    const formattedMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }))
    ];

    let fullResponse = '';
    const controller = new AbortController();
    this.activeController = controller;
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers = buildHeaders(this.apiKey, this.provider);
      const body = buildBody(
        formattedMessages, model, true, this.provider, this.temperature, this.maxTokens
      );

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const isRetryable = isRetryableStatus(response.status);
        throw new AuraVoyagerError(
          isRetryable ? ErrorCodes.API_ERROR : ErrorCodes.AUTH_ERROR,
          `API Error ${response.status}: ${response.statusText}`,
          { status: response.status, ...errorData }
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new AuraVoyagerError(ErrorCodes.API_ERROR, 'Response body is empty');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Buffer guarantees we never parse a split JSON line
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.substring(6));
            const content = extractStreamChunk(data, this.provider);
            if (content) {
              fullResponse += content;
              onChunk(fullResponse);
            }
          } catch {
            // Silently ignore malformed SSE lines
          }
        }
      }

      return fullResponse;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        // Distinguish timeout vs manual abort
        if (fullResponse) return fullResponse; // partial response on manual cancel
        throw new AuraVoyagerError(ErrorCodes.TIMEOUT, 'Request timed out or was aborted');
      }
      if (error instanceof AuraVoyagerError) throw error;
      throw new AuraVoyagerError(ErrorCodes.NETWORK_ERROR, error.message || 'Stream request failed', { originalError: error.message });
    } finally {
      this.activeController = null;
    }
  }

  /**
   * Make a non-streaming HTTP request with timeout
   */
  private async makeRequest(messages: any[], model: string, stream: boolean = false): Promise<APIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers = buildHeaders(this.apiKey, this.provider);
      const body = buildBody(messages, model, stream, this.provider, this.temperature, this.maxTokens);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal as any
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AuraVoyagerError(
          isRetryableStatus(response.status) ? ErrorCodes.API_ERROR : ErrorCodes.AUTH_ERROR,
          `API Error ${response.status}: ${response.statusText}`,
          { status: response.status, ...errorData }
        );
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          content: extractContent(data, this.provider),
          model: data.model,
          usage: data.usage
        }
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new AuraVoyagerError(ErrorCodes.TIMEOUT, 'Request timeout exceeded');
      }
      if (error instanceof AuraVoyagerError) throw error;
      throw new AuraVoyagerError(ErrorCodes.NETWORK_ERROR, error.message || 'Network request failed', { originalError: error.message });
    }
  }

  /**
   * Mock API response for testing (apiKey === 'mock')
   */
  static async mockResponse(prompt: string, onChunk?: (text: string) => void): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const lowerPrompt = prompt.toLowerCase().trim();
    let result: string;

    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      result = "Hello! I'm Aura Voyager, your unified AI assistant. I can connect to OpenAI, Anthropic, Gemini, Groq, and more — all from one SDK. How can I help you today?";
    } else if (lowerPrompt.includes('help')) {
      result = "I can help with **answering questions**, **writing code**, **summarising text**, and much more. Try asking me anything!";
    } else if (lowerPrompt.includes('provider') || lowerPrompt.includes('model')) {
      result = "Aura Voyager supports **OpenAI**, **Anthropic (Claude)**, **Google Gemini**, **Groq**, **Cohere**, **NVIDIA NIM**, and more — switch with a single config change.";
    } else {
      result = `You said: **"${prompt}"**\n\nThis is a mock response from Aura Voyager. Connect a real API key to get live AI responses from your chosen provider.`;
    }

    if (onChunk) {
      let current = '';
      const words = result.split(' ');
      for (let i = 0; i < words.length; i++) {
        current += (i > 0 ? ' ' : '') + words[i];
        onChunk(current);
        await new Promise(resolve => setTimeout(resolve, 40));
      }
    }

    return result;
  }

  /**
   * Create text embeddings (OpenAI-style)
   */
  async createEmbedding(input: string | string[], model: string): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: buildHeaders(this.apiKey, 'openai'),
      body: JSON.stringify({ input, model })
    });
    if (!response.ok) {
      throw new AuraVoyagerError(ErrorCodes.API_ERROR, `Embeddings API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  }

  /**
   * Generate an image from a text prompt (OpenAI DALL-E)
   */
  async createImage(prompt: string, size: string = '1024x1024'): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: buildHeaders(this.apiKey, 'openai'),
      body: JSON.stringify({ prompt, n: 1, size })
    });
    if (!response.ok) {
      throw new AuraVoyagerError(ErrorCodes.API_ERROR, `Image generation API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data[0].url;
  }
}
