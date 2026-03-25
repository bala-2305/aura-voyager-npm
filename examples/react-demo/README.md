# Aura Voyager - React Demo

This is a demonstration project for the `aura-voyager` SDK. It showcases how to integrate the AI chat components into a modern React application.

## Setup Steps Executed

The following steps were performed to initialize this example:

1.  **Project Initialization**: Created a new Vite + React + TypeScript project structure.
2.  **Local Linking**: Configured `package.json` to use the local version of the library:
    ```json
    "dependencies": {
      "aura-voyager": "file:../../"
    }
    ```
3.  **Component Integration**: 
    *   Implemented `AuraChat` as an inline component.
    *   Implemented `AuraPopup` as a toggleable overlay.
    *   Enabled **Mock Mode** by setting `apiKey="mock"` to allow testing without an actual API key.
4.  **Styling**: Imported the pre-bundled styles using the optimized export path:
    ```tsx
    import 'aura-voyager/style.css';
    ```
5.  **Dependency Synchronization**: Ran `npm install` to link the local library and install React 19 dependencies.

## How to Run

From the **root directory** of the `aura-voyager` project, run:

```bash
npm run example
```

This will:
1. Navigate to this directory.
2. Start the Vite development server.
3. Serve the demo at `http://localhost:3000`.

## Features Demonstrated

- **AuraChat**: A full-page or container-bound chat interface with markdown support and code highlighting.
- **AuraPopup**: A floating chat widget with customizable positioning.
- **Dark/Light Themes**: Demonstrates theme switching capabilities.
- **Mock Provider**: Simulated AI responses for development and unit testing.
