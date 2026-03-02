import { TodoistApi } from '@doist/todoist-api-typescript';
if (!process.env.TODOIST_API_TOKEN) {
    throw new Error('TODOIST_API_TOKEN is required');
}
export const todoist = new TodoistApi(process.env.TODOIST_API_TOKEN);
