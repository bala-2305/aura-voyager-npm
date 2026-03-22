# Aura Voyager

> 🚀 A production-ready AI agent SDK for React applications with plug-and-play chat UI, API integration, and intelligent interaction layer.

## Features

- ✨ **Plug-and-Play Chat UI** - Beautiful, modern chat component ready to use
- 📱 **Floating Popup Widget** - Drop-in popup chat for instant integration
- 🤖 **AI Integration** - OpenAI-compatible API with mock mode for development
- 💾 **Smart Memory Management** - Automatic chat history with localStorage persistence
- 🎨 **Theme Support** - Built-in light and dark themes
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- ⚡ **TypeScript First** - Full type safety and excellent IDE support
- 🔄 **Context Aware** - Set conversation context for personalized responses
- 🎯 **Zero Config** - Works out of the box with sensible defaults

## Installation

```bash
npm install aura-voyager
```

## Quick Start

### Basic Usage

```jsx
import { AuraChat } from 'aura-voyager';

export default function App() {
  return (
    <AuraChat
      apiKey="sk-your-api-key"
      theme="dark"
      placeholder="Ask me anything..."
    />
  );
}
```

### Using the Hook

```jsx
import { useAuraVoyager } from 'aura-voyager';

export default function MyComponent() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages
  } = useAuraVoyager({
    apiKey: 'sk-your-api-key'
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      {loading && <p>Thinking...</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Using the Popup Widget

```jsx
import { useState } from 'react';
import { AuraPopup } from 'aura-voyager';

export default function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowChat(true)}>💬 Chat</button>

      {showChat && (
        <AuraPopup
          apiKey="sk-your-api-key"
          theme="dark"
          position="bottom-right"
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}
```

### Using the Core SDK

```jsx
import { AuraVoyager } from 'aura-voyager';

const agent = new AuraVoyager({
  apiKey: 'sk-your-api-key',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.'
});

// Send a message and get response
const response = await agent.ask('What is the capital of France?');
console.log(response); // "The capital of France is Paris."

// Set context for personalized responses
agent.setContext('User is a software developer');

// Manage memory
agent.setMemory(true); // Enable chat history
const messages = agent.getMessages();
```

## API Configuration

### Environment Variables

Create a `.env` file in your project:

```bash
VITE_API_KEY=sk-your-openai-api-key
VITE_API_ENDPOINT=https://api.openai.com/v1/chat/completions
```

Then use it:

```jsx
<AuraChat
  apiKey={import.meta.env.VITE_API_KEY}
  apiEndpoint={import.meta.env.VITE_API_ENDPOINT}
/>
```

### Mock Mode (Development)

Use `apiKey="mock"` to test without an API key:

```jsx
<AuraChat apiKey="mock" /> // Uses mock responses
```

## Component Props

### AuraChat

```typescript
interface AuraChatProps {
  // Required
  apiKey: string;

  // Optional
  apiEndpoint?: string;              // Custom API endpoint
  model?: string;                    // AI model (default: 'gpt-3.5-turbo')
  systemPrompt?: string;             // Custom system prompt
  theme?: 'light' | 'dark';          // UI theme (default: 'light')
  placeholder?: string;              // Input placeholder
  showTypingAnimation?: boolean;      // Show typing animation
  onMessageSent?: (msg: string) => void; // Callback when message sent
}
```

### AuraPopup

Floating widget for easy integration - just drop it in your app!

```typescript
interface AuraPopupProps {
  // Required
  apiKey: string;

  // Optional
  apiEndpoint?: string;              // Custom API endpoint
  model?: string;                    // AI model (default: 'gpt-3.5-turbo')
  systemPrompt?: string;             // Custom system prompt
  theme?: 'light' | 'dark';          // UI theme (default: 'dark')
  placeholder?: string;              // Input placeholder
  showTypingAnimation?: boolean;      // Show typing animation
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; // Position
  onClose?: () => void;              // Callback when closed
}
```

**Usage:**
```jsx
import { AuraPopup } from 'aura-voyager';

<AuraPopup
  apiKey="sk-..."
  theme="dark"
  position="bottom-right"
  onClose={() => setShowChat(false)}
/>
```

## Hook API

### useAuraVoyager

```typescript
const {
  messages,           // Array of Message objects
  loading,            // Boolean - request in progress
  error,              // Error object or null
  sendMessage,        // (msg: string) => Promise<void>
  clearMessages,      // () => void
  setContext,         // (ctx: string) => void
  setMemory           // (enabled: boolean) => void
} = useAuraVoyager(options);
```

## Core SDK API

### AuraVoyager Class

```typescript
const agent = new AuraVoyager(config);

// Methods
agent.ask(prompt);              // Send message → Promise<string>
agent.setMemory(enabled);       // Enable/disable chat history
agent.setContext(context);      // Set conversation context
agent.getMessages();            // Get all messages
agent.getRecentMessages(limit); // Get last N messages
agent.getContext();             // Get current context
agent.clearHistory();           // Clear all messages
agent.setUserId(userId);        // Set user identifier
agent.getSessionId();           // Get session ID
agent.getConfig();              // Get current config
agent.getStats();               // Get memory stats
agent.isReady();               // Check if initialized
```

## Types

```typescript
import type {
  Message,              // Chat message object
  AuraVoyagerConfig,    // SDK configuration
  MemoryConfig,         // Memory options
  APIResponse,          // API response structure
  ConversationContext,  // Session context
  UseAuraVoyagerOptions, // Hook options
  UseAuraVoyagerReturn, // Hook return type
  AuraChatProps,        // Chat component props
  AuraPopupProps        // Popup component props
} from 'aura-voyager';
```

## Examples

### Dark Mode Example

```jsx
import { useState } from 'react';
import { AuraChat } from 'aura-voyager';

export default function ChatApp() {
  const [theme, setTheme] = useState('dark');

  return (
    <div>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
      <AuraChat
        apiKey="sk-..."
        theme={theme}
      />
    </div>
  );
}
```

### Custom Integration Example

```jsx
import { useAuraVoyager } from 'aura-voyager';

export default function ChatBot() {
  const { messages, sendMessage, loading, error } = useAuraVoyager({
    apiKey: 'sk-...',
    systemPrompt: 'You are a customer support assistant'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = e.target.message;
    await sendMessage(input.value);
    input.value = '';
  };

  return (
    <div>
      <div className="messages">
        {messages.map(m => (
          <div key={m.id} className={`message ${m.role}`}>
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          name="message"
          disabled={loading}
          placeholder="Type..."
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

### Popup Widget Example

```jsx
import { useState } from 'react';
import { AuraPopup } from 'aura-voyager';

export default function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowChat(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 16px',
          borderRadius: '24px',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          zIndex: 9998
        }}
      >
        💬 Chat
      </button>

      {showChat && (
        <AuraPopup
          apiKey="sk-..."
          theme="dark"
          position="bottom-right"
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}
```

## Running the Example

```bash
cd examples/react-demo
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

## Building

```bash
npm run build
```

Outputs to `dist/` directory ready for npm publishing.

## Error Handling

```typescript
import { AuraVoyagerError, ErrorCodes } from 'aura-voyager';

try {
  await agent.ask('Hello');
} catch (error) {
  if (error instanceof AuraVoyagerError) {
    console.error(`Error [${error.code}]: ${error.message}`);

    // Available error codes:
    // - INVALID_CONFIG
    // - API_ERROR
    // - NETWORK_ERROR
    // - TIMEOUT
    // - INVALID_REQUEST
    // - AUTH_ERROR
    // - RATE_LIMIT
    // - UNKNOWN
  }
}
```

## Popup Widget Features

The `AuraPopup` component is perfect for quickly adding chat to any website:

- **Zero Setup** - Just import and render
- **Fixed Positioning** - Stays on screen while user scrolls
- **Customizable Position** - bottom-right, bottom-left, top-right, top-left
- **Theme Support** - Dark and light themes included
- **Mobile Responsive** - Auto-adjusts on mobile devices
- **Smooth Animations** - Scale and fade animations on entry/exit
- **Compact Design** - Doesn't take up much screen space

```jsx
// Basic popup
<AuraPopup apiKey="sk-..." />

// With custom position
<AuraPopup apiKey="sk-..." position="bottom-left" />

// With dark theme
<AuraPopup apiKey="sk-..." theme="dark" />
```

## Performance Tips

1. **Use Mock Mode for Development**
   ```jsx
   <AuraChat apiKey={process.env.NODE_ENV === 'development' ? 'mock' : 'sk-...'} />
   ```

2. **Limit Message History**
   ```jsx
   const { getRecentMessages } = useAuraVoyager(options);
   const recentOnly = getRecentMessages(20);
   ```

3. **Enable Message Persistence**
   ```jsx
   const agent = new AuraVoyager({
     apiKey: 'sk-...',
     // Messages will auto-persist to localStorage
   });
   ```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

- 📖 [Documentation](https://github.com/yourusername/aura-voyager)
- 🐛 [Issues](https://github.com/yourusername/aura-voyager/issues)
- 💬 [Discussions](https://github.com/yourusername/aura-voyager/discussions)

---

**Made with ❤️ for React developers**
