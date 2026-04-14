# Backend Architecture Structure

## 1. Core Services
- **Express Server**: The main HTTP API handling webhooks, frontend static serving (if unified), and the REST API for historical data.
- **Socket.io Server**: Attached to the Express instance, listening for frontend clients to stream live mission logs.
- **Docker Orchestrator**: A dedicated module (`sandboxService.js`) responsible for spinning up containers, mounting volumes/cloning, executing scripts, and capturing metrics.
- **AI Agent Controller**: A module (`agentLoop.js`) that handles the Think-Act-Verify logic, interacting with the LLM API and the Docker Orchestrator.

## 2. Webhook Flow
1. **Endpoint**: `POST /api/webhooks/github`
2. **Validation**: Validate GitHub Signature using `GITHUB_WEBHOOK_SECRET`.
3. **Parsing**: Extract repository full name (`owner/repo`), pull request number, branch name, and commit SHA.
4. **Trigger**: If PR is opened or synchronized, dispatch to the Agent Controller and return `202 Accepted` to GitHub immediately.

## 3. Database Schema (MongoDB Mongoose)
**Mission Schema (`Mission.js`)**:
- `_id`: UUID or standard Mongo ObjectID.
- `repository`: String (e.g., "user/repo").
- `prNumber`: Number.
- `branchName`: String.
- `status`: Enum (`queued`, `in_progress`, `analyzing`, `testing`, `fixing`, `success`, `failed`, `skipped`).
- `logs`: Array of Strings (Optional: For persistence beyond the live websocket stream).
- `aiReasoning`: String (The LLM's explanation of the fix).
- `createdAt` & `updatedAt`: Timestamps.

## 4. Docker Sandbox Isolation
- **Base Image**: `node:20-alpine` (or robust parent image).
- **Execution Script**: The container runs a shell script that runs `npm install` and `npm test` capturing exit codes.
- **Data Exchange**: The Node.js parent process streams the container's `stdout` and `stderr` directly to connected Socket.io clients securely.

## 5. AI Agent Logic Details
The Agent loop uses LangGraph/LangChain or raw structured loops:
- `Think`: Parse test failure logs. Identify file context needed. Call tool `cat(filename)`.
- `Act`: Propose a full file replacement or AST modification. Write it to the container's volume.
- `Verify`: Trigger `npm test` again. If exit code `0`, break loop and proceed to commit.

## 6. GitHub Integration (Octokit)
- Authenticated via Personal Access Token or GitHub App.
- Actions:
  - Create a new branch `ghostwriter/fix-[pr-number]`.
  - Create/update files via API.
  - Create a Pull Request against the original PR's branch or leave a review comment with the patch.
