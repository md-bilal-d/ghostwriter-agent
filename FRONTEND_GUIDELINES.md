# Frontend Development Guidelines

## 1. Design Philosophy
The Ghostwriter Agent dashboard must feel strictly premium, modern, and highly responsive. It acts as an observability tool but looks like a state-of-the-art AI platform. 
We prioritize:
- **Visual Excellence**: Dark theme by default, sleek glassmorphism effects for modals and cards, and deep, tailored color palettes (e.g., #0B0F19 background, neon green #00FF66 accents for success, deep red #FF3366 for errors).
- **Dynamic Interaction**: Hover effects on all clickable elements, smooth transitions for state changes, and zero clunkiness.
- **Typography**: Modern fonts (e.g., Inter or Outfit) to ensure readability of terminal logs.

## 2. Component Architecture
- **Terminal Window (`<TerminalFeed />`)**:
  - Must simulate a real command-line interface.
  - monospace font family.
  - Auto-scroll to bottom on new log arrival from WebSocket, unless the user has manually scrolled up.
- **Mission History (`<MissionTable />`)**:
  - Clean data table with sticky headers.
  - Status badges with pulsing micro-animations when a job is active.
- **Status Indicators (`<ConnectionStatus />`)**:
  - Global indicator showing the WebSocket health.

## 3. Styling Rules
- **CSS Framework**: We use modern Tailwind CSS configured with a strictly defined color palette. Avoid arbitrary values where possible.
- **Glassmorphism**: Use `backdrop-blur-md pb-opacity-50` layered over subtle gradients for backgrounds.
- **Animations**: Use Framer Motion or native CSS transitions for modal entrances, table row mounts, and terminal line appearances.

## 4. State Management & Real-time
- Use React Context `SocketProvider` to wrap the application and expose the `socket` instance globally.
- Do not overload React state with every single log line instantly if the data rate is too high; buffer logs and flush them to state via `requestAnimationFrame` or a slight debounce to maintain 60FPS.

## 5. Responsive Design
- The terminal must take precedence on mobile, collapsing the history table into a separate tab or hamburger menu.
- Ensure touch targets on mobile are at least 44x44px.
