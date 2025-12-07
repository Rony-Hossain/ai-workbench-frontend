import { router } from './trpc/init';
import { providerRouter } from './routers/provider.router';
import { agentRouter } from './routers/agent.router';
import { projectRouter } from './routers/project.router';
import { taskRouter } from './routers/task.router';
import { conversationRouter } from './routers/conversation.router';
import { messageRouter } from './routers/message.router';

/**
 * Main application router
 * Combines all sub-routers into a single API
 */
export const appRouter = router({
  provider: providerRouter,
  agent: agentRouter,
  project: projectRouter,
  task: taskRouter,
  conversation: conversationRouter,
  message: messageRouter,
});

/**
 * Export type for client-side type safety
 */
export type AppRouter = typeof appRouter;

