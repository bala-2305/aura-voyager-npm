import { useState, useCallback, useRef, useEffect } from 'react';
import { AuraVoyager } from '../core/AuraVoyager';
import { Message } from '../core/types';
import { AuraVoyagerError } from '../utils/errors';

/**
 * Hook configuration options
 */
export interface UseAuraVoyagerOptions {
  apiKey: string;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'cohere' | 'nvidia' | 'custom' | 'mock';
  apiEndpoint?: string;
  model?: string;
  systemPrompt?: string;
  persist?: boolean;
  storageKey?: string;
}

/**
 * Hook return type
 */
export interface UseAuraVoyagerReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  stopGeneration: () => void;
  clearMessages: () => void;
  setContext: (context: string) => void;
  setMemory: (enabled: boolean) => void;
}

/**
 * React hook for integrating Aura Voyager into components
 */
export function useAuraVoyager(options: UseAuraVoyagerOptions): UseAuraVoyagerReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stable ref — never triggers re-initialization on parent re-renders
  const agentRef = useRef<AuraVoyager | null>(null);

  // Track a stable key for when the agent truly needs to be replaced
  const configKey = `${options.apiKey}::${options.provider}::${options.apiEndpoint}::${options.model}::${options.storageKey}`;
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (prevKeyRef.current === configKey && agentRef.current) return;
    prevKeyRef.current = configKey;

    try {
      agentRef.current = new AuraVoyager({
        apiKey: options.apiKey,
        provider: options.provider,
        apiEndpoint: options.apiEndpoint,
        model: options.model,
        systemPrompt: options.systemPrompt,
        persist: options.persist,
        storageKey: options.storageKey
      });
      // Restore persisted messages on mount
      setMessages(agentRef.current.getMessages());
      setError(null);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      console.error('[AuraVoyager] Failed to initialize:', e.message);
    }
  // Only reinitialize when the identity-defining config changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  // Keep systemPrompt updated without reinitializing the agent
  useEffect(() => {
    if (agentRef.current && options.systemPrompt !== undefined) {
      agentRef.current.setSystemPrompt(options.systemPrompt);
    }
  }, [options.systemPrompt]);

  /**
   * Send message to agent and get response with streaming
   */
  const sendMessage = useCallback(async (message: string) => {
    const agent = agentRef.current;
    if (!agent) {
      setError(new Error('Agent not initialized'));
      return;
    }
    if (!message.trim()) {
      setError(new Error('Message cannot be empty'));
      return;
    }

    setLoading(true);
    setError(null);

    // Use a unique ID with a high-resolution timestamp + random to avoid collisions
    const tempAiId = `temp_ai_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const tempUserMsg: Message = {
      id: `temp_user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    const tempAiMsg: Message = {
      id: tempAiId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, tempUserMsg, tempAiMsg]);

    try {
      await agent.askStream(message, (chunk: string) => {
        setMessages(prev =>
          prev.map(msg => msg.id === tempAiId ? { ...msg, content: chunk } : msg)
        );
      });
      // Sync final messages (with real IDs from the agent's memory)
      setMessages([...agent.getMessages()]);
    } catch (err) {
      const e = err instanceof AuraVoyagerError ? err : err instanceof Error ? err : new Error(String(err));
      setError(e);
      // Remove the failed optimistic AI message, keep the user message
      setMessages(prev => prev.filter(m => m.id !== tempAiId));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Abort the currently streaming response
   */
  const stopGeneration = useCallback(() => {
    agentRef.current?.abort();
    setLoading(false);
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    agentRef.current?.clearHistory();
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Set conversation context
   */
  const setContextFn = useCallback((context: string) => {
    agentRef.current?.setContext(context);
  }, []);

  /**
   * Enable/disable memory
   */
  const setMemoryFn = useCallback((enabled: boolean) => {
    agentRef.current?.setMemory(enabled);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    stopGeneration,
    clearMessages,
    setContext: setContextFn,
    setMemory: setMemoryFn
  };
}
