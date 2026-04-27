import React, { useState, FormEvent, useCallback } from 'react';
import { Message } from '../core/types';
import { ThumbsUp, ThumbsDown, Mail, AlertCircle } from 'lucide-react';
import styles from './AuraFeedback.module.css';

export interface AuraFeedbackProps {
  messages?: Message[];
  onSubmitFeedback?: (feedback: FeedbackSubmission) => Promise<void>;
  theme?: 'light' | 'dark';
}

export interface FeedbackSubmission {
  rating: 'positive' | 'negative';
  comment?: string;
  email?: string;
  messages?: Message[];
  timestamp: number;
}

/**
 * AuraFeedback - Feedback collection component
 */
export const AuraFeedback: React.FC<AuraFeedbackProps> = ({
  messages,
  onSubmitFeedback,
  theme = 'light'
}) => {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitFeedback = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      if (!rating) {
        setError('Please select a rating');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const feedback: FeedbackSubmission = {
          rating,
          comment: comment || undefined,
          email: email || undefined,
          messages: messages && messages.length > 0 ? messages : undefined,
          timestamp: Date.now()
        };

        if (onSubmitFeedback) {
          await onSubmitFeedback(feedback);
        }

        setSubmitted(true);
        setRating(null);
        setComment('');
        setEmail('');

        setTimeout(() => setSubmitted(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit feedback');
      } finally {
        setLoading(false);
      }
    },
    [rating, comment, email, messages, onSubmitFeedback]
  );

  return (
    <div className={`${styles.feedback} ${styles[theme]}`}>
      {submitted && (
        <div className={styles.successMessage}>
          Thank you for your feedback!
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmitFeedback}>
        <div className={styles.ratingGroup}>
          <label>Was this response helpful?</label>
          <div className={styles.ratingButtons}>
            <button
              type="button"
              className={`${styles.ratingButton} ${rating === 'positive' ? styles.active : ''}`}
              onClick={() => setRating('positive')}
              aria-label="Positive feedback"
            >
              <ThumbsUp size={18} />
              Yes
            </button>
            <button
              type="button"
              className={`${styles.ratingButton} ${rating === 'negative' ? styles.active : ''}`}
              onClick={() => setRating('negative')}
              aria-label="Negative feedback"
            >
              <ThumbsDown size={18} />
              No
            </button>
          </div>
        </div>

        <textarea
          className={styles.commentField}
          placeholder="Add optional feedback..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />

        <div className={styles.emailGroup}>
          <Mail size={16} />
          <input
            type="email"
            className={styles.emailField}
            placeholder="your@email.com (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading || !rating}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default AuraFeedback;
