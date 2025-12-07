# Local AI Chat with Ollama

This is a simple Next.js chat application that interfaces with a local LLM running via [Ollama](https://ollama.com/).

## Features

- **Local Inference**: Runs entirely on your machine. No data leaves your network.
- **Streaming Responses**: Real-time token streaming for a chat-like experience.
- **Minimal UI**: Clean, distraction-free interface.

## Prerequisites

1.  **Install Ollama**: Download and install Ollama from [ollama.com](https://ollama.com).
2.  **Pull the Model**: This app defaults to `gemma2:2b`. Run the following command in your terminal:
    ```bash
    ollama pull gemma2:2b
    ```
    *(Note: You can change the model in `src/app/api/chat/route.ts` if you prefer another one like `llama3` or `mistral`)*.
3.  **Start Ollama**: Ensure Ollama is running in the background.

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open the App**:
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **AI Backend**: Ollama (Local API)

## License

MIT
