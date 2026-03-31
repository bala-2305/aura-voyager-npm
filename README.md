# Aura Voyager

A production-ready AI agent SDK for React applications with plug-and-play chat UI, API integration, and an intelligent interaction layer.

## Features

- **Plug-and-Play Chat UI**: Beautiful, modern chat component ready to use.
- **Floating Popup Widget**: Drop-in popup chat for instant integration.
- **AI Integration**: OpenAI and NVIDIA NIM compatible API with a native mock mode for development.
- **Streaming Responses**: Real-time server-sent events (SSE) support for progressive text rendering.
- **Markdown & Syntax Highlighting**: Native support for Markdown formatting and code block highlighting via `react-markdown` and `highlight.js`.
- **Smart Memory Management**: Automatic chat history with progressive persistence.
- **Theme Support**: Built-in light and dark themes.
- **Fully Responsive**: Adapts seamlessly perfectly across mobile, tablet, and desktop viewports.
- **TypeScript First**: Full type safety and excellent IDE support.
- **Context Aware**: Configure conversation context dynamically for personalized responses.
- **Zero Config**: Works out of the box with sensible enterprise-grade defaults.

## Installation

```bash
npm install aura-voyager
```
*Explanation*: This command downloads and installs the `aura-voyager` SDK and its peer dependencies into your `node_modules` directory, making it available for import in your React application.

## Quick Start

### Basic Usage

```tsx
import { AuraChat } from 'aura-voyager';

export default function App() {
  return (
    <AuraChat
      apiKey="sk-your-api-key"
      provider="openai"
      theme="dark"
      placeholder="Ask me anything..."
    />
  );
}
```
*Explanation*: The `<AuraChat />` component is a fully-styled, plug-and-play chat interface. By providing your exact API key and selecting the target provider (e.g., `openai`), it automatically handles user inputs, renders responses, manages chat histories, and updates the UI using internal state hooks.

### NVIDIA NIM Support

Aura Voyager natively supports NVIDIA NIM models out of the box. Simply set the `provider` prop to `nvidia`.

```tsx
<AuraChat
  apiKey="nvapi-your-nvidia-nim-key"
  provider="nvidia"
  // Defaults to meta/llama3-70b-instruct
  model="google/gemma-2-9b-it" 
/>
```
*Explanation*: Setting the `provider` attribute to `nvidia` instructs the SDK to dynamically route all requests to NVIDIA's NIM endpoints. You can also explicitly assign an NVIDIA catalog model name, enabling enterprise-scale models efficiently within the same component constraint.

### Using the Hook

For headless integration, utilize the `useAuraVoyager` hook which natively handles streaming states and text chunks.

```tsx
import { useAuraVoyager } from 'aura-voyager';
import ReactMarkdown from 'react-markdown';

export default function MyComponent() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages
  } = useAuraVoyager({
    apiKey: 'sk-your-api-key',
    provider: 'openai'
  });

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id} className={`message-${msg.role}`}>
          <strong>{msg.role}:</strong> 
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      ))}
      {loading && <p>Thinking...</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```
*Explanation*: Utilizing the `useAuraVoyager` hook allows deeper integration and absolute layout control. In this example, we map over the internal `messages` array manually, rendering each model chunk progressively and safely parsing the text strings using `ReactMarkdown` to support formatting elements natively.

### Using the Popup Widget

```tsx
import { useState } from 'react';
import { AuraPopup } from 'aura-voyager';

export default function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowChat(true)}>Chat</button>

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
*Explanation*: The `<AuraPopup />` widget provides a floating, persistent chat icon that toggles standard chat functionalities. It incorporates the exact same attributes as the `AuraChat` component but confines the UI styling to an absolutely positioned overlay container.

### Using the Core SDK

```typescript
import { AuraVoyager } from 'aura-voyager';

const agent = new AuraVoyager({
  apiKey: 'sk-your-api-key',
  provider: 'openai',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.'
});

// Send a message and handle the stream
const response = await agent.askStream('What is the capital of France?', (chunk) => {
  console.log('Streaming chunk:', chunk);
});
console.log('Final response:', response);

// Set context for personalized responses
agent.setContext('User is a software developer');

// Manage memory
agent.setMemory(true); // Enable chat history
const messages = agent.getMessages();
```
*Explanation*: The underlying core SDK revolves around the `AuraVoyager` object wrapper. As demonstrated, invoking `.askStream` registers a callback to receive incoming Server-Sent Event (SSE) token chunks in real time, granting direct control over system prompts and internal application memory states independent of React hooks.

## API Configuration

### Environment Variables

Create a `.env` file in your project:

```bash
VITE_API_KEY=sk-your-api-key
VITE_PROVIDER=openai
```
*Explanation*: Setting definitions inside your `.env` configuration protects sensitive values during development configurations. The `VITE_API_KEY` ensures your private token is dynamically pulled into your local builds safely without hardcoding.

Then use it:

```tsx
<AuraChat
  apiKey={import.meta.env.VITE_API_KEY}
  provider={import.meta.env.VITE_PROVIDER}
/>
```
*Explanation*: Accessing `import.meta.env` dynamically imports your pre-defined global variables directly into the SDK properties, maintaining operational security standards recommended by modern build tools like Vite.

### Mock Mode (Development)

Use `apiKey="mock"` to test local workflows without an external API key or internet connection:

```tsx
<AuraChat apiKey="mock" /> // Uses local mock responses
```
*Explanation*: Supplying the literal string `"mock"` as an API key bypasses all HTTP pipeline logic. The internal SDK network client simulates network delays and yields static fallback responses, avoiding API quota expenses during UI prototyping phases.

## Component Props

### AuraChat

```typescript
interface AuraChatProps {
  // Required
  apiKey: string;

  // Optional
  provider?: 'openai' | 'nvidia' | 'custom'; // AI Provider (default: 'openai')
  apiEndpoint?: string;              // Custom API endpoint override
  model?: string;                    // AI model override
  systemPrompt?: string;             // Custom system prompt configuration
  theme?: 'light' | 'dark';          // UI theme (default: 'light')
  placeholder?: string;              // Input placeholder text
  showTypingAnimation?: boolean;      // Show typing animation indicator
  onMessageSent?: (msg: string) => void; // Callback hook when message sent
}
```
*Explanation*: The `AuraChatProps` Typescript schema describes all officially supported attributes assignable to the component. Properties handle everything from API overriding to cosmetic adjustments (such as placeholder wording and themes).

### AuraPopup

Floating widget designed for easy application integration.

```typescript
interface AuraPopupProps extends AuraChatProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; // Layout position
  onClose?: () => void;              // Callback hook when close button clicked
}
```
*Explanation*: Built on top of `AuraChatProps`, the popup attributes structure introduces additional specific layout definitions, assigning constraints like edge `position` and establishing the `onClose` callback hooks.

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
*Explanation*: Destructuring the `useAuraVoyager` return map yields direct access to the stateful arrays evaluating user interaction logic alongside the fundamental transmission triggers like `sendMessage` and `setContext`.

## Types

```typescript
import type {
  Message,              // Chat message protocol object
  AuraVoyagerConfig,    // SDK configuration structure
  MemoryConfig,         // Memory configuration options
  APIResponse,          // External API response structure
  ConversationContext,  // Session context metadata
  UseAuraVoyagerOptions, // Hook configuration options
  UseAuraVoyagerReturn, // Hook return signature
  AuraChatProps,        // Chat component properties
  AuraPopupProps        // Popup component properties
} from 'aura-voyager';
```
*Explanation*: Importable TypeScript interfaces allow type-safe validation enforcing standard shapes. Enforcing strict schema guidelines ensures reliable API interaction mappings over unpredictable request objects.

## Error Handling

```typescript
import { AuraVoyagerError, ErrorCodes } from 'aura-voyager';

try {
  await agent.askStream('Hello', (chunk) => {});
} catch (error) {
  if (error instanceof AuraVoyagerError) {
    console.error(`Error [${error.code}]: ${error.message}`);

    // Standardized error codes:
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
*Explanation*: Handling exceptions around API interactions relies on the `AuraVoyagerError` object type. Evaluators can cross-reference the returned `.code` attribute against documented internal constants preventing unchecked crash loops securely.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome. Please submit a Pull Request following the established code conventions.

## License

MIT

## Support

- Documentation: https://github.com/bala-2305/aura-voyager-npm
- Issues: https://github.com/bala-2305/aura-voyager-npm/issues
- Discussions: https://github.com/bala-2305/aura-voyager-npm/discussions

---

Maintained for React developers.Under development.
