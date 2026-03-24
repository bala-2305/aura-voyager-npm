import React, { useEffect, useRef, useState, FormEvent, KeyboardEvent } from 'react';
import { useAuraVoyager, UseAuraVoyagerOptions } from '../hooks/useAuraVoyager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RotateCcw, 
  Sparkles
} from 'lucide-react';
import styles from './AuraChat.module.css';
/**
 * Theme options for AuraChat component
 */

export type Theme = 'light' | 'dark';

/**
 * Props for AuraChat component
 */
export interface AuraChatProps extends UseAuraVoyagerOptions {
  theme?: Theme;
  placeholder?: string;
  showTypingAnimation?: boolean;
  onMessageSent?: (message: string) => void;
}

/**
 * AuraChat - Complete chat UI component for React
 * @param props Component configuration and options
 * @returns React component
 * @example
 * <AuraChat
 *   apiKey="sk-..."
 *   theme="dark"
 *   placeholder="Ask me anything..."
 * />
 */
export const AuraChat: React.FC<AuraChatProps> = ({
  theme = 'light',
  placeholder = 'Type your message...',
  showTypingAnimation = true,
  onMessageSent,
  ...auraOptions
}) => {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages
  } = useAuraVoyager(auraOptions);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle message submission
   */
  
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const messageText = input;
    setInput('');

    onMessageSent?.(messageText);
    await sendMessage(messageText);
  };

  /**
   * Handle Enter key press
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  /**
   * Handle clear chat
   */
  const handleClearChat = () => {
    clearMessages();
    setInput('');
  };

  return (
    <div 
      className={`aura-chat ${styles.container} ${styles[`theme-${theme}`]}`}
      data-aura-chat="true"
    >
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Aura Voyager</h2>
        <button
          className={styles.clearBtn}
          onClick={handleClearChat}
          title="Clear chat history"
          aria-label="Clear chat"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Sparkles size={48} className={styles.sparkleIcon} />
            </div>
            <p className={styles.emptyText}>
              Start a conversation with Aura Voyager
            </p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`aura-message ${styles.message} ${styles[`role-${message.role}`]}`}
            data-role={message.role}
          >
            <div className={styles.messageBubble}>
              {message.role === 'assistant' ? (
                <span className={styles.avatar}>
                  <Bot size={20} />
                </span>
              ) : (
                <span className={styles.avatar}>
                  <User size={20} />
                </span>
              )}
              <div className={styles.messageContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
            <span className={styles.timestamp}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        ))}

        {loading && showTypingAnimation && (
          <div className={`aura-message aura-typing ${styles.message} ${styles['role-assistant']}`}>
            <div className={styles.messageBubble}>
              <span className={styles.avatar}>
                <Bot size={20} />
              </span>
              <div className={styles.typingAnimation}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        className={`aura-input-form ${styles.inputForm}`} 
        onSubmit={handleSendMessage}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className={styles.input}
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={styles.sendBtn}
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 size={18} className={styles.spin} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};

export default AuraChat;
