import React, { useEffect, useRef, useState, FormEvent, KeyboardEvent, useCallback } from 'react';
import { useAuraVoyager, UseAuraVoyagerOptions } from '../hooks/useAuraVoyager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import {
  Send,
  Bot,
  User,
  MessageSquare,
  RotateCcw,
  Sparkles,
  X,
  Square,
  Copy,
  Check
} from 'lucide-react';
import styles from './AuraPopup.module.css';

export interface AuraPopupProps extends UseAuraVoyagerOptions {
  theme?: 'light' | 'dark';
  placeholder?: string;
  showTypingAnimation?: boolean;
  title?: string;
  onClose?: () => void;
  onError?: (error: Error) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * AuraPopup - Floating chat widget for React
 */
export const AuraPopup: React.FC<AuraPopupProps> = ({
  theme = 'dark',
  placeholder = 'Type your message...',
  showTypingAnimation = true,
  title = 'Aura Voyager',
  onClose = () => {},
  onError,
  position = 'bottom-right',
  ...auraOptions
}: AuraPopupProps) => {
  const {
    messages,
    loading,
    error,
    sendMessage,
    stopGeneration,
    clearMessages
  } = useAuraVoyager(auraOptions);

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={`aura-popup ${styles.popup} ${styles[`position-${position}`]} ${styles[`theme-${theme}`]}`}
      data-aura-popup="true"
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <MessageSquare size={16} />
          {title}
        </h3>
        <div className={styles.headerActions}>
          <button
            className={styles.clearBtn}
            onClick={clearMessages}
            title="Clear chat"
            aria-label="Clear chat"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            title="Close chat"
            aria-label="Close chat"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 && !error && (
          <div className={styles.emptyState}>
            <Sparkles size={36} className={styles.sparkleIcon} />
            <p className={styles.emptyText}>Start chatting!</p>
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
              <span className={styles.avatar}>
                {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </span>
              <div className={styles.messageContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.role === 'assistant' && message.content && (
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(message.id, message.content)}
                  title="Copy"
                  aria-label="Copy message"
                >
                  {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && showTypingAnimation && (
          <div className={`aura-message aura-typing ${styles.message} ${styles['role-assistant']}`}>
            <div className={styles.messageBubble}>
              <span className={styles.avatar}><Bot size={16} /></span>
              <div className={styles.typingAnimation}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className={`aura-input-form ${styles.inputForm}`} onSubmit={handleSend}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); adjustTextarea(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          rows={1}
          className={styles.input}
          aria-label="Message input"
        />
        {loading ? (
          <button
            type="button"
            onClick={stopGeneration}
            className={`${styles.sendBtn} ${styles.stopBtn}`}
            aria-label="Stop generation"
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className={styles.sendBtn}
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        )}
      </form>
    </div>
  );
};

export default AuraPopup;
