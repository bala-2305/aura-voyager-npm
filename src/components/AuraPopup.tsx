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
  MessageSquare, 
  RotateCcw, 
  Sparkles,
  X
} from 'lucide-react';
import styles from './AuraPopup.module.css';
/**
 * Props for AuraPopup component
 */
export interface AuraPopupProps extends UseAuraVoyagerOptions {
  theme?: 'light' | 'dark';
  placeholder?: string;
  showTypingAnimation?: boolean;
  onClose?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * AuraPopup - Floating chat widget for React
 * Easy to integrate popup chat that can be placed anywhere
 * @param props Component configuration and options
 * @returns React component
 * @example
 * <AuraPopup
 *   apiKey="sk-..."
 *   onClose={() => setShowPopup(false)}
 * />
 */
export const AuraPopup: React.FC<AuraPopupProps> = ({
  theme = 'dark',
  placeholder = 'Type your message...',
  showTypingAnimation = true,
  onClose = () => {},
  position = 'bottom-right',
  ...auraOptions
}: AuraPopupProps) => {
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

  return (
    <div 
      className={`aura-popup ${styles.popup} ${styles[`position-${position}`]} ${styles[`theme-${theme}`]}`}
      data-aura-popup="true"
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <MessageSquare size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Aura Voyager
        </h3>
        <div className={styles.headerActions}>
          <button
            className={styles.clearBtn}
            onClick={() => clearMessages()}
            title="Clear chat"
            aria-label="Clear chat"
          >
            <RotateCcw size={16} />
          </button>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            title="Close chat"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Sparkles size={40} className={styles.sparkleIcon} />
            </div>
            <p className={styles.emptyText}>
              Start chatting!
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
                  <Bot size={18} />
                </span>
              ) : (
                <span className={styles.avatar}>
                  <User size={18} />
                </span>
              )}
              <div className={styles.messageContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {loading && showTypingAnimation && (
          <div className={`aura-message aura-typing ${styles.message} ${styles['role-assistant']}`}>
            <div className={styles.messageBubble}>
              <span className={styles.avatar}>
                <Bot size={18} />
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
            <Loader2 size={16} className={styles.spin} />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
};

export default AuraPopup;
