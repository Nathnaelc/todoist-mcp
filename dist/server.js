import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { todoist } from './todoist/client.js';
export const server = new McpServer({
    name: 'todoist-mcp',
    version: '1.0.0',
});
// ── TOOL 1: Get Tasks ─────────────────────────────────────────────────────────
server.registerTool('get_tasks', {
    description: 'Fetch tasks from Todoist. Optionally filter by project or overdue status.',
    inputSchema: {
        filter: z.string().optional().describe('Todoist filter string e.g. "overdue", "today", "p1", "#Work"'),
    },
}, async ({ filter }) => {
    const response = filter
        ? await todoist.getTasksByFilter({ query: filter })
        : await todoist.getTasks();
    const tasks = response.results;
    if (tasks.length === 0) {
        return { content: [{ type: 'text', text: 'No tasks found.' }] };
    }
    const formatted = tasks.map(t => {
        const due = t.due?.date ?? 'no due date';
        const priority = ['', 'p4', 'p3', 'p2', 'p1'][t.priority];
        return `[${t.id}] ${priority} | due: ${due} | ${t.content}`;
    }).join('\n');
    return { content: [{ type: 'text', text: formatted }] };
});
// ── TOOL 2: Add Comment (Enrich a task) ──────────────────────────────────────
server.registerTool('add_comment', {
    description: 'Add a helpful comment to a task with context, phone numbers, tips, links, etc.',
    inputSchema: {
        taskId: z.string().describe('The Todoist task ID'),
        comment: z.string().describe('The comment content to add'),
    },
}, async ({ taskId, comment }) => {
    await todoist.addComment({ taskId, content: comment });
    return { content: [{ type: 'text', text: `Comment added to task ${taskId}` }] };
});
// ── TOOL 3: Create Subtask ────────────────────────────────────────────────────
server.registerTool('create_subtask', {
    description: 'Break down a parent task by creating a subtask under it.',
    inputSchema: {
        parentId: z.string().describe('The parent task ID'),
        content: z.string().describe('Subtask title'),
        dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
    },
}, async ({ parentId, content, dueDate }) => {
    const task = await todoist.addTask(dueDate ? { content, parentId, dueDate } : { content, parentId });
    return { content: [{ type: 'text', text: `Subtask created: [${task.id}] ${task.content}` }] };
});
// ── TOOL 4: Reschedule Task ───────────────────────────────────────────────────
server.registerTool('reschedule_task', {
    description: 'Update the due date of a task.',
    inputSchema: {
        taskId: z.string().describe('The Todoist task ID'),
        dueDate: z.string().describe('New due date in YYYY-MM-DD format or natural language like "tomorrow"'),
    },
}, async ({ taskId, dueDate }) => {
    await todoist.updateTask(taskId, { dueDate });
    return { content: [{ type: 'text', text: `Task ${taskId} rescheduled to ${dueDate}` }] };
});
// ── TOOL 5: Complete Task ─────────────────────────────────────────────────────
server.registerTool('complete_task', {
    description: 'Mark a task as complete.',
    inputSchema: {
        taskId: z.string().describe('The Todoist task ID'),
    },
}, async ({ taskId }) => {
    await todoist.closeTask(taskId);
    return { content: [{ type: 'text', text: `Task ${taskId} marked complete.` }] };
});
// ── TOOL 6: Get Projects ──────────────────────────────────────────────────────
server.registerTool('get_projects', {
    description: 'List all projects, displayed as an indented tree with subprojects under their parent.',
    inputSchema: {},
}, async () => {
    const response = await todoist.getProjects();
    const projects = response.results;
    const byId = new Map(projects.map(p => [p.id, p]));
    const lines = [];
    for (const p of projects) {
        const parentId = 'workspaceId' in p ? null : p.parentId;
        const indent = parentId ? '  ' : '';
        const parentNote = parentId ? ` (sub of ${byId.get(parentId)?.name ?? parentId})` : '';
        lines.push(`${indent}[${p.id}] ${p.name}${parentNote}`);
    }
    return { content: [{ type: 'text', text: lines.join('\n') || 'No projects found.' }] };
});
// ── TOOL 7: Create Task ───────────────────────────────────────────────────────
server.registerTool('create_task', {
    description: 'Create a new task with full metadata.',
    inputSchema: {
        content: z.string().describe('Task title'),
        description: z.string().optional().describe('Optional task description'),
        projectId: z.string().optional().describe('Project to add the task to'),
        parentId: z.string().optional().describe('Parent task ID to nest under'),
        priority: z.number().int().min(1).max(4).optional().describe('Priority 1 (urgent) to 4 (normal)'),
        dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format or natural language'),
        labels: z.array(z.string()).optional().describe('Label names to apply'),
        durationMinutes: z.number().int().positive().optional().describe('Estimated duration in minutes'),
    },
}, async ({ content, description, projectId, parentId, priority, dueDate, labels, durationMinutes }) => {
    const base = { content, description, projectId, parentId, priority, labels };
    const withDuration = durationMinutes
        ? { ...base, duration: durationMinutes, durationUnit: 'minute' }
        : base;
    const args = dueDate ? { ...withDuration, dueDate } : withDuration;
    const task = await todoist.addTask(args);
    return { content: [{ type: 'text', text: `Task created: [${task.id}] ${task.content}` }] };
});
// ── TOOL 8: Move Task ─────────────────────────────────────────────────────────
server.registerTool('move_task', {
    description: 'Move a task to a different project.',
    inputSchema: {
        taskId: z.string().describe('The Todoist task ID'),
        projectId: z.string().describe('The destination project ID'),
    },
}, async ({ taskId, projectId }) => {
    await todoist.moveTask(taskId, { projectId });
    return { content: [{ type: 'text', text: `Task ${taskId} moved to project ${projectId}.` }] };
});
// ── TOOL 9: Get Comments ──────────────────────────────────────────────────────
server.registerTool('get_comments', {
    description: 'Fetch all comments on a task.',
    inputSchema: {
        taskId: z.string().describe('The Todoist task ID'),
    },
}, async ({ taskId }) => {
    const response = await todoist.getComments({ taskId });
    const comments = response.results;
    if (comments.length === 0) {
        return { content: [{ type: 'text', text: 'No comments found.' }] };
    }
    const formatted = comments.map(c => `[${c.postedAt}] (uid:${c.postedUid}): ${c.content}`).join('\n');
    return { content: [{ type: 'text', text: formatted }] };
});
// ── TOOL 10: Search Tasks ─────────────────────────────────────────────────────
server.registerTool('search_tasks', {
    description: 'Full-text search across tasks using Todoist filter syntax e.g. "search: IRS", "#Work & overdue", "@waiting".',
    inputSchema: {
        query: z.string().describe('Todoist filter string passed directly, e.g. "search: IRS", "#Work & overdue", "@waiting"'),
    },
}, async ({ query }) => {
    const response = await todoist.getTasksByFilter({ query });
    const tasks = response.results;
    if (tasks.length === 0) {
        return { content: [{ type: 'text', text: 'No tasks found.' }] };
    }
    const formatted = tasks.map(t => {
        const due = t.due?.date ?? 'no due date';
        const priority = ['', 'p4', 'p3', 'p2', 'p1'][t.priority];
        return `[${t.id}] ${priority} | due: ${due} | ${t.content}`;
    }).join('\n');
    return { content: [{ type: 'text', text: formatted }] };
});
// ── TOOL 11: Get Labels ───────────────────────────────────────────────────────
server.registerTool('get_labels', {
    description: 'List all user-defined labels.',
    inputSchema: {},
}, async () => {
    const response = await todoist.getLabels();
    const labels = response.results;
    if (labels.length === 0) {
        return { content: [{ type: 'text', text: 'No labels found.' }] };
    }
    const formatted = labels.map(l => `[${l.id}] ${l.name} | color: ${l.color}${l.isFavorite ? ' ★' : ''}`).join('\n');
    return { content: [{ type: 'text', text: formatted }] };
});
// ── TOOL 12: Create Label ─────────────────────────────────────────────────────
server.registerTool('create_label', {
    description: 'Create a new label.',
    inputSchema: {
        name: z.string().describe('Label name'),
        color: z.string().optional().describe('Color name e.g. "red", "blue", "green"'),
        isFavorite: z.boolean().optional().describe('Pin to favorites'),
    },
}, async ({ name, color, isFavorite }) => {
    const label = await todoist.addLabel({
        name,
        ...(color ? { color: color } : {}),
        isFavorite,
    });
    return { content: [{ type: 'text', text: `Label created: [${label.id}] ${label.name}` }] };
});
// ── TOOL 13: Get Completed Tasks ──────────────────────────────────────────────
server.registerTool('get_completed_tasks', {
    description: 'Get recently completed tasks — useful for weekly recaps and reviews.',
    inputSchema: {
        since: z.string().optional().describe('ISO date string to fetch from (default: 7 days ago)'),
        limit: z.number().int().positive().optional().describe('Max tasks to return (default: 50)'),
    },
}, async ({ since, limit = 50 }) => {
    const sinceDate = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const untilDate = new Date().toISOString().slice(0, 10);
    const response = await todoist.getCompletedTasksByCompletionDate({
        since: sinceDate,
        until: untilDate,
        limit,
    });
    const tasks = response.items;
    if (tasks.length === 0) {
        return { content: [{ type: 'text', text: `No completed tasks found since ${sinceDate}.` }] };
    }
    const formatted = tasks.map(t => {
        const completed = t.completedAt ?? 'unknown date';
        return `[${t.id}] completed: ${completed} | ${t.content}`;
    }).join('\n');
    return { content: [{ type: 'text', text: formatted }] };
});
// ── TOOL 14: Get Sections ─────────────────────────────────────────────────────
server.registerTool('get_sections', {
    description: 'List all sections within a project.',
    inputSchema: {
        projectId: z.string().describe('The project ID to list sections for'),
    },
}, async ({ projectId }) => {
    const response = await todoist.getSections({ projectId });
    const sections = response.results;
    if (sections.length === 0) {
        return { content: [{ type: 'text', text: 'No sections found.' }] };
    }
    const formatted = sections
        .sort((a, b) => a.sectionOrder - b.sectionOrder)
        .map(s => `[${s.id}] (order:${s.sectionOrder}) ${s.name}`)
        .join('\n');
    return { content: [{ type: 'text', text: formatted }] };
});
// ── TOOL 15: Create Section ───────────────────────────────────────────────────
server.registerTool('create_section', {
    description: 'Create a new section inside a project.',
    inputSchema: {
        projectId: z.string().describe('The project ID to create the section in'),
        name: z.string().describe('Section name'),
        order: z.number().int().optional().describe('Position order within the project'),
    },
}, async ({ projectId, name, order }) => {
    const section = await todoist.addSection({ projectId, name, order });
    return { content: [{ type: 'text', text: `Section created: [${section.id}] ${section.name}` }] };
});
