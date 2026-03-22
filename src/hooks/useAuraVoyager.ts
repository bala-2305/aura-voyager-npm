import { useState, useCallback, useRef, useEffect } from 'react';
import { AuraVoyager } from '../core/AuraVoyager';
import { Message } from '../core/types';
import { AuraVoyagerError } from '../utils/errors';

/**
 * Hook configuration options
 */
export interface UseAuraVoyagerOptions {
  apiKey: string;
  provider?: 'openai' | 'nvidia' | 'custom';
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
        provider: options.provider,
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
  }, [options.apiKey, options.provider, options.apiEndpoint, options.model, options.systemPrompt]);

  /**
   * Send message to agent and get response with streaming
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

      const tempAiId = 'temp_ai_' + Date.now();
      const tempUserMsg: Message = {
        id: 'temp_user_' + Date.now(),
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

      // Optimistically show user message and empty AI message
      setMessages(prev => [...prev, tempUserMsg, tempAiMsg]);

      try {
        await agentRef.current.askStream(message, (chunk: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === tempAiId ? { ...msg, content: chunk } : msg
            )
          );
        });

        // Update messages state from agent to have real IDs
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
        
        // Re-sync messages state to remove the temp AI message if it failed
        if (agentRef.current) {
           setMessages([...agentRef.current.getMessages()]);
        }
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
