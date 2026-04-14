# Technical Stack Specification

## Stack Overview
Full-stack MERN application with Docker for isolated sandbox execution and LangGraph/OpenAI SDKs for AI logic, integrated tightly with GitHub (Octokit).

## Frontend Stack
- **UI Library**: React.js 18+
- **Styling**: Vanilla CSS (Premium, dark-mode, sleek glassmorphism design) or Tailwind CSS (if opted for utility-first approach, adhering to sleek aesthetic requirements).
- **State Management**: React Context API (for global connection state, WebSocket instances).
- **Form Handling**: React Hook Form (if needed for settings).
- **HTTP Client**: Axios or native `fetch`.
- **Real-time Communication**: `socket.io-client`.
- **Routing**: React Router DOM v6.

## Backend Stack
- **Runtime**: Node.js (v18 or v20 LTS).
- **Framework**: Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **GitHub Integration**: `@octokit/rest` & `@octokit/webhooks` / `crypto` (for payload validation).
- **AI Processing**: `@google/genai` (Gemini 1.5 Pro) or `openai` (GPT-4o), optionally LangChain/LangGraph JS for structured agent loops.
- **Real-time Communication**: `socket.io` server attached to Express.
- **Containerization Interface**: `dockerode` or standard `child_process` `exec`/`spawn` wrapping Docker CLI.

## DevOps and Infrastructure
- **Version Control**: Git & GitHub.
- **Environment Management**: `dotenv` for `.env`.
- **Sandbox**: Docker Engine (Host must have Docker installed).
- **Webhook Forwarding (Local Dev)**: `smee.io` client.

## Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ghostwriter-agent
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_TOKEN=your_github_personal_access_token
OPENAI_API_KEY=your_openai_api_key_or_gemini_key
SMEE_WEBHOOK_URL=https://smee.io/your_custom_url
```

## Security Considerations
- **Isolated Inference**: Node.js host executes zero target-repo code. All `npm i` and `npm t` commands occur inside ephemeral Docker containers.
- **Webhook Validation**: Use crypto to verify Git Webhook signature hash to prevent unauthorized triggers.
- **Data Protection**: MongoDB only stores logs, commits, and diffs, not sensitive core application secrets.

## Version Upgrade Policy
- **Minor/Patch Updates**: Allowed strictly; handled automatically via dependabot/npm audit.
- **Major Updates**: Blocked unless explicitly refactored manually.

## Performance Guidelines
- **Log Streaming**: WebSocket payloads should be buffered slightly if logs are heavily verbose to prevent UI lag.
- **Docker Cleanup**: Ephemeral containers must have `--rm` flags or explicit cleanup routines to prevent host storage exhaustion.
