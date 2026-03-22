/**
 * Aura Voyager - AI Agent SDK for React
 * Production-ready library with TypeScript support
 */

// Core exports
export { AuraVoyager } from './core/AuraVoyager';

// Type exports
export type {
  Message,
  AuraVoyagerConfig,
  MemoryConfig,
  APIResponse,
  ConversationContext
} from './core/types';

// Hook exports
export { useAuraVoyager } from './hooks/useAuraVoyager';
export type { UseAuraVoyagerOptions, UseAuraVoyagerReturn } from './hooks/useAuraVoyager';

// Component exports
export { AuraChat } from './components/AuraChat';
export type { AuraChatProps, Theme } from './components/AuraChat';
export { AuraPopup } from './components/AuraPopup';
export type { AuraPopupProps } from './components/AuraPopup';

// Utility exports
export { AuraVoyagerError, ErrorCodes, getErrorMessage } from './utils/errors';
export type { ErrorCodes as ErrorCodesType } from './utils/errors';
