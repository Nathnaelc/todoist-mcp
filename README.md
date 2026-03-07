# Todoist MCP Server

An **MCP (Model Context Protocol) server** that lets Claude (and other MCP-capable clients) manage your Todoist: tasks, projects, labels, sections, comments, scheduling, and completions.

It runs over **stdio transport** (Claude Desktop starts it as a local process and calls its tools).

## Features

- **Read and search tasks** (including Todoist filter queries)
- **Create / update / move / complete / delete tasks**
- **Add and read comments**
- **Projects + sections** (list + create)
- **Labels** (list + create)
- **Recently completed tasks** for reviews/recaps

## Requirements

- **Node.js 20+** (required by `@doist/todoist-api-typescript`)
- A **Todoist API token**
  - In Todoist: **Settings → Integrations → Developer** (copy your API token)

## Install

```bash
npm install
```

## Connect to Claude Desktop (macOS)

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

## How authentication works

This server authenticates to Todoist using the environment variable:

- **`TODOIST_API_TOKEN`**

When using Claude Desktop, set that token in the `mcpServers.<name>.env` block (see the config snippet above).

## Troubleshooting

- **Claude can’t start the server**
  - Verify the `command` exists (e.g. `node`) and the `args[0]` path points to a real file (`dist/index.js`).
  - Re-run `npm run build` after pulling updates.
- **`TODOIST_API_TOKEN is required`**
  - Your token wasn’t provided to the server process. Re-check the `env` block in `claude_desktop_config.json`.
- **Nothing shows up / filters behave oddly**
  - `get_tasks.filter` and `search_tasks.query` are passed to Todoist’s filter language. Try simple queries like `"today"`, `"overdue"`, or `"search: <word>"`.

## License

MIT — see `LICENSE`.


## MCP CLI helper

A lightweight CLI wrapper is available for scripting and cron usage.

List tools:

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

## Daily triage script

Run a generic daily triage and pass any Todoist filter:

```bash
./scripts/daily-triage.sh "today"
./scripts/daily-triage.sh "#BT & overdue"
./scripts/daily-triage.sh "#Salesforce & today"
./scripts/daily-triage.sh "##Salesforce"
```

Filter examples:

```text
#ProjectName & (overdue | today)
##ParentProject
#BT & @moon
```

The script writes timestamped results to `logs/`.
