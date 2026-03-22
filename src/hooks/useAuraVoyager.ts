import { useState, useCallback, useRef, useEffect } from 'react';
import { AuraVoyager } from '../core/AuraVoyager';
import { Message } from '../core/types';
import { AuraVoyagerError } from '../utils/errors';

/**
 * Hook configuration options
 */
export interface UseAuraVoyagerOptions {
  apiKey: string;
  apiEndpoint?: string;
  model?: string;
  systemPrompt?: string;
}

/**
 * Hook return type
 */
export interface UseAuraVoyagerReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  setContext: (context: string) => void;
  setMemory: (enabled: boolean) => void;
}

/**
 * React hook for integrating Aura Voyager into components
 * @param options Configuration options with apiKey
 * @returns Hook interface with messages, loading state, and methods
 * @example
 * const {
 *   messages,
 *   loading,
 *   error,
 *   sendMessage,
 *   clearMessages
 * } = useAuraVoyager({ apiKey: 'sk-...' });
 */
export function useAuraVoyager(
  options: UseAuraVoyagerOptions
): UseAuraVoyagerReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const agentRef = useRef<AuraVoyager | null>(null);

  // Initialize agent on mount
  useEffect(() => {
    try {
      agentRef.current = new AuraVoyager({
        apiKey: options.apiKey,
        apiEndpoint: options.apiEndpoint,
        model: options.model,
        systemPrompt: options.systemPrompt
      });

      // Sync initial messages from agent
      setMessages(agentRef.current.getMessages());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Failed to initialize AuraVoyager:', error);
    }
  }, [options.apiKey, options.apiEndpoint, options.model, options.systemPrompt]);

  /**
   * Send message to agent and get response
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!agentRef.current) {
        setError(new Error('Agent not initialized'));
        return;
      }

      if (!message.trim()) {
        setError(new Error('Message cannot be empty'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await agentRef.current.ask(message);
        // Update messages state from agent
        setMessages([...agentRef.current.getMessages()]);
      } catch (err) {
        const error =
          err instanceof AuraVoyagerError
            ? err
            : err instanceof Error
              ? err
              : new Error(String(err));
        setError(error);
        console.error('Error sending message:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.clearHistory();
      setMessages([]);
      setError(null);
    }
  }, []);

  /**
   * Set conversation context
   */
  const setContextFn = useCallback((context: string) => {
    if (agentRef.current) {
      agentRef.current.setContext(context);
    }
  }, []);

  /**
   * Enable/disable memory
   */
  const setMemoryFn = useCallback((enabled: boolean) => {
    if (agentRef.current) {
      agentRef.current.setMemory(enabled);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    setContext: setContextFn,
    setMemory: setMemoryFn
  };
}
