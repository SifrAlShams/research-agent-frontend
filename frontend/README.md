# AI Research Agent Frontend
(https://research-agent-frontend-j5hp.vercel.app)

A modern Next.js 14+ frontend for the LangGraph-based research agent system.

## Features

- **Real-time WebSocket Updates**: Live progress tracking as research executes
- **Multi-Agent Auditing**: Visual feedback from researcher, auditor, refiner, and report generator nodes
- **Ephemeral Report View**: Download markdown reports with automatic session clearing for privacy
- **Error Handling**: Graceful error display and connection management
- **Responsive Design**: Tailwind CSS-based responsive UI with professional typography

## Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Backend server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` (optional - defaults are provided):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

### Lint
```bash
npm run lint
```

## Architecture

### Components

- **Research Input**: Topic submission with Enter key support
- **Progress Tracker**: Real-time status updates from backend
- **Report Display**: Markdown-rendered research synthesis
- **Download & Clear**: Privacy-focused session termination

### WebSocket Flow

1. User submits topic
2. Frontend establishes WebSocket to `/ws/research/{threadId}`
3. Backend streams `status` updates (multiple messages)
4. Backend sends final message with `is_final: true` and `report_content`
5. Frontend closes connection and optionally clears report on download

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend HTTP API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | Backend WebSocket URL |

## Backend Integration

Expects backend to provide:

- **WebSocket Endpoint**: `GET /ws/research/{threadId}`
  - Input: `{ topic: string }`
  - Output (streaming): `{ status?: string, error?: string, is_final?: boolean, report_content?: string }`

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **@tailwindcss/typography**: Professional prose styling for report display
- **Lucide React**: Icon library for UI elements

## Privacy Features

- No persistent storage of reports
- "Download & Clear" action removes report from memory and UI
- Session data cleared on download completion
