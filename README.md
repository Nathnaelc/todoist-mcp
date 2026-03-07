# Todoist MCP Server

An **MCP (Model Context Protocol) server** that lets Claude (and other MCP-capable clients) manage your Todoist: tasks, projects, labels, sections, comments, scheduling, and completions.

It runs over **stdio transport** (Claude Desktop starts it as a local process and calls its tools).

## Use this with CLI (GPT-ready + cron-friendly)

If you do not want to be locked to Claude Desktop, use the included CLI wrapper.

### 1) Build once

```bash
npm run build
```

### 2) Put your Todoist token in your shell env

```bash
export TODOIST_API_TOKEN="YOUR_TODOIST_API_TOKEN"
```

### 3) List available MCP tools from terminal

```bash
npm run mcp:call -- --list-tools
```

### 4) Call a tool directly from terminal

```bash
npm run mcp:call -- --tool get_tasks --args '{"filter":"#Salesforce_quick & (overdue | today)"}'
```

This gives you a **CLI control plane** you can use with:

- GPT agents/orchestrators (they call this CLI command),
- shell scripts,
- cron jobs,
- CI/CD scheduled runs.

### 5) Example automation script (safe daily triage)

Create `scripts/daily-salesforce-quick-triage.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /ABSOLUTE/PATH/TO/todoist-mcp
export TODOIST_API_TOKEN="YOUR_TODOIST_API_TOKEN"

# 1) Pull urgent tasks in your Salesforce_quick scope
npm run mcp:call -- --tool get_tasks --args '{"filter":"#Salesforce_quick & (overdue | today)"}' > /tmp/sf_quick_today.json

# 2) (Optional) add your own logic here to inspect JSON and call update/reschedule tools
```

Then schedule with cron:

```cron
0 8 * * * /ABSOLUTE/PATH/TO/todoist-mcp/scripts/daily-salesforce-quick-triage.sh >> /ABSOLUTE/PATH/TO/todoist-mcp/logs/triage.log 2>&1
```

### 6) GPT integration pattern

Use GPT for planning text, and use this CLI for deterministic execution:

1. GPT generates a proposed plan (dry run).
2. You approve.
3. GPT (or your script) executes `npm run mcp:call -- --tool ... --args ...` in batches.

This keeps AI usage efficient while still automating your Todoist operations.

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

## Practical setup to reduce stuck sessions and model usage

If you want reliable operation without long interactive sessions:

1. Keep Todoist mutations in CLI commands (`npm run mcp:call ...`).
2. Use GPT/Claude mainly for planning and review summaries.
3. Run recurring jobs on cron for predictable low-touch execution.

### Suggested operating model

- **Batch actions**: ask the agent to do one grouped operation (e.g. triage overdue + reschedule + tag), instead of many small interactive turns.
- **Time-box automation runs**: execute a morning and evening run via CLI/script, then stop.
- **Fallback-first prompts**: ask the agent to produce a dry-run plan first, then execute.
- **Idempotent routines**: prefer workflows that can run twice safely (e.g., add label only if missing).

### Example focus prompt for your Salesforce_quick area

Use Todoist filter queries to keep the agent focused on the correct project/subprojects:

- `"#Salesforce_quick | ##Salesforce_quick"` (project + nested projects)
- `"#Salesforce_quick & (overdue | today)"`
- `"#Salesforce_quick & !@waiting"`

Then ask the agent to:

- list top 10 actionable tasks,
- identify blockers,
- convert large tasks into subtasks,
- reschedule realistically,
- and return a concise execution plan.

### Recommended guardrails for autonomous runs

- Cap writes per run (example: max 20 updates).
- Require confirmation for destructive tools (`delete_task`).
- Log each run summary (what changed, what failed, what needs manual follow-up).
- Keep a recovery query handy (e.g. recent updates via labels/comments) so you can audit quickly.

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
