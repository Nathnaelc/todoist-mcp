# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Run in development mode (tsx, no build step)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled output from dist/
```

## Architecture

This is a **Model Context Protocol (MCP) server** that exposes Todoist as a tool-callable API for AI assistants. It runs over stdio transport.

**Entry point flow:**
1. `src/index.tsx` — loads `.env`, imports the server, connects it to `StdioServerTransport`
2. `src/server.ts` — defines the `McpServer` instance and registers all MCP tools
3. `src/todoist/client.ts` — initializes `TodoistApi` from `@doist/todoist-api-typescript` using `TODOIST_API_TOKEN`

**MCP tools defined in `server.ts`:**
- `get_tasks` — fetch tasks with optional Todoist filter string
- `add_comment` — add a comment to a task by ID
- `create_subtask` — create a subtask under a parent task
- `reschedule_task` — update a task's due date
- `complete_task` — mark a task as complete

## Environment

Requires a `.env` file at the project root with:
```
TODOIST_API_TOKEN=<your_token>
```

## TypeScript

- `module: Node16` / `moduleResolution: Node16` — imports must use `.js` extensions even for `.ts` source files (e.g., `import './server.js'`)
- Output goes to `dist/`
