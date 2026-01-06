# 🐱 Orange Cat - Secure AI Assistant

**Orange Cat** is a secure, privacy-first personal AI assistant powered by Google's Gemini 2.5 Flash model. 

Unlike traditional AI apps, Orange Cat utilizes a **Zero-Server Architecture**. It runs entirely in your browser (client-side), and all chat history is encrypted using military-grade AES-256 encryption before being stored in your device's local storage.

## 🚀 Features

*   **🔒 Zero-Server Privacy:** No backend database. Your chats never leave your device (except to be processed by the AI API).
*   **🔑 End-to-End Encryption:** Data is encrypted at rest using AES-GCM 256-bit encryption.
*   **⚡ Powered by Gemini:** Uses `gemini-2.5-flash` for high speed and low latency.
*   **🛒 Shopping Expert:** Specialized system instructions for Amazon product discovery and trend finding.
*   **💻 Coding Assistant:** Senior-level engineering prompts for code generation and debugging.
*   **🕵️‍♂️ Incognito Mode:** Toggle temporary chat sessions that are never saved to disk.
*   **☁️ Google Search Grounding:** Real-time information retrieval using Google Search tools.
*   **📦 Backup & Restore:** Export your encrypted JSON data to move between devices.

## 🛠 Tech Stack

*   **Framework:** React 19, TypeScript, Vite
*   **AI Provider:** Google Gemini API (`@google/genai` SDK)
*   **Styling:** Tailwind CSS, Lucide React (Icons)
*   **Security:** Web Crypto API (Native browser cryptography)
*   **Markdown:** `react-markdown`, `remark-gfm`

## 🔐 Security Architecture

Orange Cat implements a "Master Key" architecture similar to password managers.

1.  **Key Derivation:** When you set a PIN, we use `PBKDF2` (100,000 iterations) with a random salt to derive a cryptographic key.
2.  **Master Key Generation:** A random UUID is generated as the session's **Master Key**.
3.  **Key Wrapping:** The Master Key is encrypted using the PIN-derived key and stored in `localStorage`.
4.  **Data Encryption:** All chat sessions are stringified and encrypted via **AES-GCM** using the Master Key.
5.  **Recovery:** A Recovery Code is generated during setup. This code creates a *second* encrypted copy of the Master Key, allowing access if the PIN is lost.

*Note: Because there is no server, if you lose your PIN and your Recovery Code, your data is mathematically impossible to recover.*

## 🚦 Getting Started

### Prerequisites

*   Node.js (v18+)
*   A Google Cloud Project with the **Generative Language API** enabled.
*   An API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/orange-cat.git
    cd orange-cat
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_gemini_api_key_here
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🌍 Deployment

### Vercel (Recommended)

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  **Crucial Step:** In Vercel Project Settings > Environment Variables, add:
    *   `API_KEY`: Your Google Gemini API Key.
4.  Deploy.

### Security Best Practice for Public Deployment

Since this is a client-side app, your API key is exposed in network requests. To prevent misuse:

1.  Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2.  Edit your API Key.
3.  Under **Application restrictions**, select **Websites**.
4.  Add your domain (e.g., `https://orange-cat.vercel.app/*`).
5.  Under **API restrictions**, select **Restrict key** and choose only **Generative Language API**.

## 📄 License

MIT License. Feel free to fork and modify!
