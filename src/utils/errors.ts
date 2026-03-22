/**
 * Custom error class for Aura Voyager
 */
export class AuraVoyagerError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuraVoyagerError';
  }
}

/**
 * Error codes
 */
export const ErrorCodes = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN'
} as const;

/**
 * Get user-friendly error message
 */
export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    [ErrorCodes.INVALID_CONFIG]: 'Invalid SDK configuration provided',
    [ErrorCodes.API_ERROR]: 'API request failed',
    [ErrorCodes.NETWORK_ERROR]: 'Network error occurred',
    [ErrorCodes.TIMEOUT]: 'Request timeout',
    [ErrorCodes.INVALID_REQUEST]: 'Invalid request',
    [ErrorCodes.AUTH_ERROR]: 'Authentication failed',
    [ErrorCodes.RATE_LIMIT]: 'Rate limit exceeded',
    [ErrorCodes.UNKNOWN]: 'An unknown error occurred'
  };

  return messages[code] || 'An error occurred';
}
