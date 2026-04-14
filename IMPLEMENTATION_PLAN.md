# Implementation Plan

## Phase 1: Foundation & Scaffolding
1. **Initialize Project Root**: Create `backend` and `frontend` folders.
2. **Backend Setup**: Initialize `package.json`, install Express, Mongoose, Socket.io, Dotenv, Octokit.
3. **Frontend Setup**: Initialize React (Vite/CRA), configure Tailwind CSS, install Socket.io-client.
4. **Environment Configuration**: Setup `.env.example` with required keys.
5. **Database Connection**: Implement initial MongoDB connection script.

## Phase 2: GitHub Webhooks & Data Models
1. **Mission Model**: Create the Mongoose schema for Missions.
2. **Webhook Endpoint**: Create `/api/webhooks/github` route.
3. **Validation logic**: Implement HMAC signature verification.
4. **Smee.io Setup**: Create a local script to forward webhooks for development.

## Phase 3: The Docker Sandbox Engine
1. **Dockerfile**: Create a generic `sandbox/Dockerfile` for running `npm test`.
2. **Docker Orchestrator**: Write `sandboxService.js` to dynamically create/start containers using Node.js `child_process`.
3. **Stream Capture**: Capture container `stdout`/`stderr` and emit to an internal event bus.

## Phase 4: Agentic AI Integration
1. **LLM Client Setup**: Initialize Google Gen AI / OpenAI SDK.
2. **System Prompts**: Draft the "Ghostwriter" system prompt enforcing JSON outputs and clear reasoning.
3. **The Loop**: Implement the Think-Act-Verify logic.
4. **Octokit Committer**: Write the logic to create a branch, push the diff, and open a PR.

## Phase 5: Frontend Dashboard & Observability
1. **Base Layout**: Implement dark mode, glassmorphic layout.
2. **Socket Integration**: Connect to backend Socket.io.
3. **Terminal View**: Build the auto-scrolling terminal feed UI.
4. **History Table**: Fetch and display past missions from MongoDB.

## Phase 6: Final Polish
1. Readme polishing.
2. End-to-end testing with a dummy repository.
3. Error handling and timeout edge-cases.
