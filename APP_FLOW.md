# Application Flow Map

## 1. Entry Points
- **Primary Entry Point**: The React Dashboard (`/`). Accessed by Developers/Managers to monitor agent status.
- **System Entry Point**: GitHub Webhook Route (`/api/webhook`). Triggered automatically by GitHub.

## 2. Core User Flows

### Flow 1: Live Monitoring (Dashboard)
- **Page**: Landing Page / Mission Control Dashboard
- **User Actions**: User lands on page, views "Live Terminal Feed", views "Mission History".
- **Frequency**: Regular checking during PR cycles.
- **Happy Path**: 
  - User opens React App.
  - WebSocket connects seamlessly.
  - User sees idle state or live streaming logs of current agent job.
- **System Action**: 
  - Backend emits `log` events via Socket.io. 
  - Backend fetches Mission History from MongoDB on page load.
- **Error States & Edge Cases**:
  - WebSocket connection drops: UI shows "Reconnecting..."
  - Docker daemon fails: UI displays alert from backend "Sandbox Generation Failed".

### Flow 2: Automated Self-Healing (System Flow)
- **Flow Name**: PR Webhook to AI Fix
- **Trigger**: GitHub Webhook (`ping`, `pull_request` opened/synchronized).
- **System Actions**:
  1. Backend receives payload, validates action type.
  2. Backend creates a new Mission record in MongoDB (Status: In Progress).
  3. Spawns Docker container.
  4. Container clones PR branch and runs `npm install` & `npm test`.
  - **Decision Point A (Tests Pass)**: 
    - Transition: Update Mission in MongoDB (Status: Skipped/Passed). Terminate container.
  - **Decision Point B (Tests Fail)**:
    - Transition: Enter Agentic Loop.
    - AI analyzes error, queries files, writes fix.
    - AI runs `npm test` inside Docker.
    - **Decision Point B.1 (Fix Fails)**: Retry loop (max iteration limit reached -> Status: Failed).
    - **Decision Point B.2 (Fix Passes)**: Proceed to push.
  5. Octokit creates a PR or commits to the existing branch.
  6. Update Mission in MongoDB (Status: Success, with PR Link).
  7. Terminate Container.
- **Error Handling**: Graceful termination of looping LLM calls, Docker timeout safeguards.

## 3. Screen Inventory (Frontend)
1. **Header**: Navigation & Status Indicator (Online/Offline).
2. **Terminal Window**: Auto-scrolling, dark-themed simulated console outputting Socket.io messages.
3. **Mission History Table**: A table/list of past events with Columns: ID, Repo, PR Link, Status (Success/Fail), Date.
4. **Mission Details Modal**: Clicking a history item shows the precise diffs or logs for that run.

## 4. Responsive Behavior
- **Mobile Constraints**: Terminal window should occupy full width, font size adjusted. History table horizontally scrollable.
- **Desktop Specific**: Side-by-side terminal and history layouts.

## 5. Animation and Transitions
- **Typing effect**: Terminal logs should appear quickly but smoothly.
- **Status Indicators**: Pulsing green dot for "Agent Idle", pulsing orange dot for "Agent Working", red dot for "Connection Lost".
