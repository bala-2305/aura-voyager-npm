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
  RotateCcw,
  Sparkles,
  Square,
  Copy,
  Check
} from 'lucide-react';
import styles from './AuraChat.module.css';

export type Theme = 'light' | 'dark';

export interface AuraChatProps extends UseAuraVoyagerOptions {
  theme?: Theme;
  placeholder?: string;
  showTypingAnimation?: boolean;
  title?: string;
  onMessageSent?: (message: string) => void;
  onError?: (error: Error) => void;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * AuraChat - Complete chat UI component for React
 */
export const AuraChat: React.FC<AuraChatProps> = ({
  theme = 'light',
  placeholder = 'Type your message...',
  showTypingAnimation = true,
  title = 'Aura Voyager',
  onMessageSent,
  onError,
  ...auraOptions
}) => {
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

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notify parent of errors
  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  // Auto-grow textarea
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onMessageSent?.(text);
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
      className={`aura-chat ${styles.container} ${styles[`theme-${theme}`]}`}
      data-aura-chat="true"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bot size={18} className={styles.headerIcon} />
          <h2 className={styles.title}>{title}</h2>
        </div>
        <button
          className={styles.clearBtn}
          onClick={clearMessages}
          title="Clear chat history"
          aria-label="Clear chat"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Sparkles size={48} className={styles.sparkleIcon} />
            </div>
            <p className={styles.emptyText}>Start a conversation</p>
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
                {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
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
                  title="Copy to clipboard"
                  aria-label="Copy message"
                >
                  {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
            <span className={styles.timestamp}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && showTypingAnimation && (
          <div className={`aura-message aura-typing ${styles.message} ${styles['role-assistant']}`}>
            <div className={styles.messageBubble}>
              <span className={styles.avatar}><Bot size={18} /></span>
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
            title="Stop generation"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className={styles.sendBtn}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        )}
      </form>
    </div>
  );
};

export default AuraChat;
