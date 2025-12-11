# Dexter Web UI

## Overview

The Dexter Web UI provides a modern, browser-based interface for interacting with the Dexter financial research agent. Built with Next.js and React, it offers real-time streaming responses, task visualization, and a clean chat interface.

## Features

- **Real-time Streaming**: See answers as they're generated
- **Task Visualization**: Watch as Dexter plans and executes research tasks
- **Subtask Progress**: Monitor individual subtask completion
- **Chat History**: Maintain context across multiple queries
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS for a clean, professional look

## Architecture

### Frontend (Next.js + React)
- **app/page.tsx**: Main chat interface component
- **app/layout.tsx**: Root layout with metadata
- **app/globals.css**: Global styles with Tailwind CSS

### Backend (API Routes)
- **app/api/chat/route.ts**: Streaming API endpoint that:
  - Receives user queries
  - Creates Agent instance with callbacks
  - Streams events back to the client via Server-Sent Events (SSE)
  - Handles task planning, execution, and answer generation

### Agent Integration
The Web UI uses the same Agent architecture as the CLI:
- TaskPlanner: Plans tasks and subtasks
- TaskExecutor: Executes financial data tools
- AnswerGenerator: Generates final answers

## Running the Web UI

### Development Mode
```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
bun run build
bun run start
```

## API Endpoints

### POST /api/chat
Handles financial research queries with streaming responses.

**Request:**
```json
{
  "query": "What was Apple's revenue growth over the last 4 quarters?",
  "messageHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

Event types:
- `query`: User query received
- `tasks`: Tasks planned
- `subtasks`: Subtasks planned
- `taskStart`: Task started
- `taskComplete`: Task completed
- `subtaskStart`: Subtask started
- `subtaskComplete`: Subtask completed
- `spinner`: Loading indicator
- `answerStart`: Answer generation started
- `answer`: Answer chunk (streaming)
- `answerEnd`: Answer complete
- `error`: Error occurred
- `done`: Stream complete

## Technology Stack

- **Framework**: Next.js 16.0.8 with App Router
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 4.1.17
- **Runtime**: Bun
- **Language**: TypeScript
- **Agent**: LangChain.js with OpenAI/Anthropic/Google

## Configuration

Environment variables (`.env`):
```bash
# Required
OPENAI_API_KEY=your-openai-api-key
FINANCIAL_DATASETS_API_KEY=your-financial-datasets-api-key

# Optional
DEFAULT_MODEL=gpt-4.1  # or claude-sonnet-4-5, gemini-3
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
```

## Development

### Project Structure
```
app/
├── api/
│   └── chat/
│       └── route.ts          # Streaming API endpoint
├── page.tsx                   # Main chat UI
├── layout.tsx                 # Root layout
└── globals.css                # Global styles

src/
└── agent/                     # Shared agent logic
    ├── agent.ts
    ├── task-planner.ts
    ├── task-executor.ts
    └── answer-generator.ts
```

### Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run cli` - Run terminal CLI version
- `bun run typecheck` - Type check all files

## Features in Detail

### Real-time Task Visualization
The UI displays:
- Main tasks with checkmarks when complete
- Subtasks nested under each task
- Progress indicators
- Completion status

### Streaming Answers
- Answers are displayed character-by-character as they're generated
- Provides immediate feedback to users
- Maintains context for follow-up questions

### Error Handling
- Network errors are caught and displayed
- API errors are shown to users
- Graceful degradation when services are unavailable

## Future Enhancements

Potential features to add:
- Export chat history
- Share conversations
- Multiple conversation threads
- Dark mode
- Voice input
- Chart/graph visualization for financial data
- Model selection in UI
- Settings panel
