import { NextRequest } from 'next/server';
import { Agent } from '@/src/agent/agent';
import { MessageHistory } from '@/src/utils/message-history';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Task {
  id: number;
  description: string;
  done: boolean;
}

interface SubTask {
  id: number;
  description: string;
  done: boolean;
}

interface PlannedTask {
  id: number;
  description: string;
  subtasks: SubTask[];
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const { query, messageHistory } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const tasks: Task[] = [];
        const plannedTasks: PlannedTask[] = [];

        // Helper to send SSE data
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Create agent with callbacks
        const agent = new Agent({
          model: process.env.DEFAULT_MODEL || 'gpt-4.1',
          callbacks: {
            onUserQuery: (query: string) => {
              sendEvent('query', { query });
            },
            onTasksPlanned: (newTasks: Task[]) => {
              tasks.push(...newTasks);
              sendEvent('tasks', { tasks: newTasks });
            },
            onSubtasksPlanned: (newPlannedTasks: PlannedTask[]) => {
              plannedTasks.push(...newPlannedTasks);
              sendEvent('subtasks', { subtasks: newPlannedTasks });
            },
            onTaskStart: (taskId: number) => {
              sendEvent('taskStart', { taskId });
            },
            onTaskComplete: (taskId: number, success: boolean) => {
              const task = tasks.find(t => t.id === taskId);
              if (task) {
                task.done = true;
              }
              sendEvent('taskComplete', { taskId, success });
            },
            onSubTaskStart: (taskId: number, subTaskId: number) => {
              sendEvent('subtaskStart', { taskId, subTaskId });
            },
            onSubTaskComplete: (taskId: number, subTaskId: number, success: boolean) => {
              const plannedTask = plannedTasks.find(t => t.id === taskId);
              if (plannedTask) {
                const subtask = plannedTask.subtasks.find(st => st.id === subTaskId);
                if (subtask) {
                  subtask.done = true;
                }
              }
              sendEvent('subtaskComplete', { taskId, subTaskId, success });
            },
            onDebug: (message: string) => {
              sendEvent('debug', { message });
            },
            onSpinnerStart: (message: string) => {
              sendEvent('spinner', { message, active: true });
            },
            onSpinnerStop: () => {
              sendEvent('spinner', { active: false });
            },
            onAnswerStream: async (answerStream: AsyncGenerator<string>) => {
              sendEvent('answerStart', {});
              for await (const chunk of answerStream) {
                sendEvent('answer', { chunk });
              }
              sendEvent('answerEnd', {});
            },
          },
        });

        // Parse message history if provided
        let history: MessageHistory | undefined;
        if (messageHistory && Array.isArray(messageHistory)) {
          history = new MessageHistory();
          for (const msg of messageHistory) {
            if (msg.role === 'user') {
              history.addUserMessage(msg.content);
            } else if (msg.role === 'assistant') {
              history.addAssistantMessage(msg.content);
            }
          }
        }

        // Run the agent
        await agent.run(query, history);

        sendEvent('done', {});
        controller.close();
      } catch (error: any) {
        console.error('Agent error:', error);
        const message = `event: error\ndata: ${JSON.stringify({
          error: error.message || 'An error occurred'
        })}\n\n`;
        controller.enqueue(encoder.encode(message));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
