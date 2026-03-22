# Aura Voyager - Complete Project Structure

## 📁 Directory Structure

```
aura-voyager/
├── src/
│   ├── core/
│   │   ├── AuraVoyager.ts      # Main SDK class
│   │   ├── types.ts            # TypeScript interfaces
│   │   └── memory.ts           # Chat history manager
│   ├── hooks/
│   │   └── useAuraVoyager.ts   # React hook
│   ├── components/
│   │   ├── AuraChat.tsx        # Chat UI component
│   │   └── AuraChat.module.css # Component styles
│   ├── utils/
│   │   ├── api.ts             # API client
│   │   └── errors.ts          # Error handling
│   └── index.ts               # Library exports
├── examples/
│   └── react-demo/
│       ├── src/
│       │   ├── App.tsx        # Demo app component
│       │   ├── App.module.css # Demo styles
│       │   ├── main.tsx       # Entry point
│       │   └── index.html     # HTML template
│       ├── package.json       # Demo dependencies
│       ├── tsconfig.json      # TypeScript config
│       ├── tsconfig.node.json # Node TypeScript config
│       └── vite.config.ts     # Vite configuration
├── package.json               # Main package config
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite build config
├── README.md                  # Documentation
├── LICENSE                    # MIT License
├── .gitignore                 # Git ignore rules
└── .npmignore                 # NPM ignore rules
```

## 🎯 Key Features

### 1. Core SDK (`src/core/AuraVoyager.ts`)
- Main class that encapsulates all AI agent functionality
- Configurable API endpoints and models
- Built-in retry logic and error handling
- Support for custom system prompts
- Session and user tracking

### 2. Memory System (`src/core/memory.ts`)
- Maintains chat history
- Context-aware conversations
- Optional localStorage persistence
- Configurable message limits
- Statistics tracking

### 3. React Integration (`src/hooks/useAuraVoyager.ts`)
- Custom hook for React components
- Manages agent initialization
- Handles loading and error states
- Exposes message state
- Simple API for sending messages

### 4. Chat Component (`src/components/AuraChat.tsx`)
- Pre-built, production-ready UI
- Dark/Light theme support
- Auto-scrolling message list
- Typing animation
- Responsive design
- Accessibility features

### 5. API Client (`src/utils/api.ts`)
- OpenAI-compatible API integration
- Exponential backoff retry logic
- Request timeout handling
- Mock mode for development
- Proper error handling

### 6. Error Handling (`src/utils/errors.ts`)
- Custom AuraVoyagerError class
- Standardized error codes
- User-friendly error messages
- Error details propagation

## 📦 Exports

The library exports:
```typescript
// Components
export { AuraChat }

// Classes
export { AuraVoyager }

// Hooks
export { useAuraVoyager }

// Types
export type { 
  Message,
  AuraVoyagerConfig,
  MemoryConfig,
  APIResponse,
  ConversationContext,
  UseAuraVoyagerOptions,
  UseAuraVoyagerReturn,
  AuraChatProps
}

// Utilities
export { AuraVoyagerError, ErrorCodes, getErrorMessage }
```

## 🚀 Development Setup

```bash
# Install dependencies
npm install

# Build library
npm run build

# Development with watch mode
npm run dev

# Type checking
npm run type-check

# Run example
npm run example
```

## 📝 Build Output

Built files go to `dist/`:
- `dist/index.js` - CommonJS bundle
- `dist/index.es.js` - ES module bundle
- `dist/index.d.ts` - TypeScript declarations

## 🎨 Component Features

### AuraChat Component
- ✨ Modern gradient header
- 💬 Message bubbles with avatars
- ⏳ Typing animation
- 🎯 Auto-scroll to latest message
- 📱 Mobile responsive
- 🌓 Dark/Light theme
- ♿ Accessibility support
- ⚡ Smooth animations

### Styling
- CSS Modules for scoped styling
- CSS custom properties for theming
- Responsive breakpoints
- Smooth transitions
- Custom scrollbar styling

## 🔧 Configuration

### Environment Variables
```bash
VITE_API_KEY=sk-your-key
VITE_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

### AuraVoyager Config
```typescript
{
  apiKey: string;              // Required: OpenAI API key
  apiEndpoint?: string;        // Optional: Custom API endpoint
  maxRetries?: number;         // Default: 3
  retryDelay?: number;         // Default: 1000ms
  timeout?: number;            // Default: 30000ms
  systemPrompt?: string;       // Default: helpful assistant prompt
  model?: string;              // Default: 'gpt-3.5-turbo'
}
```

## 📚 Example Usage

### Basic Component Usage
```jsx
import { AuraChat } from 'aura-voyager';

<AuraChat apiKey="sk-..." theme="dark" />
```

### Hook Usage
```jsx
import { useAuraVoyager } from 'aura-voyager';

const {
  messages,
  loading,
  error,
  sendMessage,
  clearMessages
} = useAuraVoyager({ apiKey: 'sk-...' });
```

### Core SDK Usage
```jsx
import { AuraVoyager } from 'aura-voyager';

const agent = new AuraVoyager({ apiKey: 'sk-...' });
const response = await agent.ask('Hello!');
```

## 🧪 Testing

Use mock mode during development:
```jsx
<AuraChat apiKey="mock" />
```

The mock API provides realistic responses without requiring an API key.

## 📤 Publishing to npm

1. Update version in `package.json`
2. Run `npm run build`
3. Run `npm publish`

The library is ready for production use and npm publishing.
