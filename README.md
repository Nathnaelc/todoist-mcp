# Todoist MCP Server and CLI

An **MCP (Model Context Protocol) server** that lets Claude (and other MCP-capable clients) manage your Todoist: tasks, projects, labels, sections, comments, scheduling, and completions.

It runs over **stdio transport** (Claude Desktop starts it as a local process and calls its tools).

## Features

- **Full task management** – Create, read, update, reschedule, complete, or delete tasks
- **Powerful search & filtering** – Use Todoist's filter syntax (e.g., `today`, `overdue`, `#ProjectName`)
- **Comments** – Add and retrieve task comments
- **Projects & sections** – Organize and create projects and sections
- **Labels** – Create and manage task labels
- **Completed tasks** – Review recently finished tasks (useful for recaps and summaries)
- **Subtasks** – Create nested tasks with independent scheduling
- **Natural language scheduling** – Reschedule tasks with plain English due dates

## Requirements

- **Node.js 20+** (required by `@doist/todoist-api-typescript`)
- A **Todoist API token**
  - In Todoist: **Settings → Integrations → Developer** (copy your API token)

## Install

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/todoist_mcp.git
cd todoist_mcp
npm install
```

## Connect to Claude Desktop

**Note:** These instructions are for macOS. For Linux/Windows, you'll need to adjust the config path and use forward slashes in file paths.

Claude Desktop reads MCP servers from:

- `~/Library/Application Support/Claude/claude_desktop_config.json`

Only the `mcpServers` section matters here.

### 1) Build the server

From this repo:

```bash
npm run build
```

This produces `dist/index.js`.

### 2) Add an MCP server entry (with your token)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add an entry under `mcpServers` like this (use your own absolute paths):

```json
{
  "mcpServers": {
    "todoist": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/todoist_mcp/dist/index.js"],
      "env": {
        "TODOIST_API_TOKEN": "YOUR_TODOIST_API_TOKEN"
      }
    }
  }
}
```

Notes:

- **Do not commit** your token anywhere (keep it only in your local Claude config).
- If you already have other MCP servers configured, **merge** the `"todoist"` entry into your existing `"mcpServers"` object.

### 3) Restart Claude Desktop

Quit Claude Desktop completely and reopen it. You should now be able to ask Claude to use Todoist tools.

## Quick start

Once set up, you can ask Claude things like:

- "Show me my overdue tasks"
- "Create a task to review the budget for next Monday"
- "Move all urgent tasks to the Work project"
- "What did I complete this week?"
- "Add a comment to task #12345 saying I need to follow up"

## Tool catalog

This server registers the following MCP tools:

- **`get_tasks`**: List tasks (optional Todoist filter query like `"today"`, `"overdue"`, `"#Work"`, `"p1"`).
- **`get_task`**: Fetch a single task by ID (useful before editing).
- **`search_tasks`**: Full-text search via Todoist filter syntax (e.g. `"search: taxes"`).
- **`create_task`**: Create a task (supports description, project/section, parent, labels, priority, due string, duration).
- **`create_subtask`**: Create a subtask under an existing parent task (optionally with a `YYYY-MM-DD` due date).
- **`update_task`**: Update task fields (rename, description, priority, labels, due).
- **`move_task`**: Move a task to a different project.
- **`reschedule_task`**: Change a task’s due date (natural language supported).
- **`complete_task`**: Mark a task complete.
- **`delete_task`**: Permanently delete a task (cannot be undone).
- **`add_comment`**: Add a comment to a task.
- **`get_comments`**: List comments on a task.
- **`get_projects`**: List projects (shown as a simple tree/indented list).
- **`get_sections`**: List sections in a project.
- **`create_section`**: Create a section in a project.
- **`get_labels`**: List labels.
- **`create_label`**: Create a label.
- **`get_completed_tasks`**: List recently completed tasks (since a date, with a limit).

## Development

Run in development mode (no build step):

```bash
npm run dev
```

Build TypeScript:

```bash
npm run build
```

Run the compiled server:

```bash
npm run start
```

## Troubleshooting

- **Claude can’t start the server**
  - Verify the `command` exists (e.g. `node`) and the `args[0]` path points to a real file (`dist/index.js`).
  - Re-run `npm run build` after pulling updates.
- **`TODOIST_API_TOKEN is required`**
  - Your token wasn’t provided to the server process. Re-check the `env` block in `claude_desktop_config.json`.
- **Nothing shows up / filters behave oddly**
  - `get_tasks.filter` and `search_tasks.query` are passed to Todoist’s filter language. Try simple queries like `"today"`, `"overdue"`, or `"search: <word>"`.

## MCP CLI

A lightweight CLI wrapper is available for scripting and cron usage.

List all tools:

```bash
npm run mcp:call -- --list-tools
```

Call a tool:

```bash
npm run mcp:call -- --tool get_tasks --args '{"filter":"today"}'
```

Cross-platform `--args` quoting (Windows-friendly):

```bash
npm run mcp:call -- --tool get_tasks --args "{\"filter\":\"today\"}"
```

Development mode (runs the TypeScript server directly via `tsx`):

```bash
npm run mcp:call:dev -- --tool get_tasks --args "{\"filter\":\"today\"}"
```

**Filter examples:**

```text
today
overdue
#MyProject & (overdue | today)
##ParentProject
search: urgent
```

## Contributing

Contributions are welcome! Feel free to open issues, submit pull requests, or suggest improvements. Check out the existing code and tests to get started.
Dropping your star would be appreciated too!

## Resources

- [Todoist API Docs](https://developer.todoist.com/rest/v2/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Desktop Setup](https://claude.ai/download)

## License

MIT — see `LICENSE`.