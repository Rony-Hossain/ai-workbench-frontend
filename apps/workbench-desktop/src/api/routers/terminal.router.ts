import { router, publicProcedure } from '@ai-workbench/shared/trpc-server';

export const terminalRouter = router({
  // TODO: Implement terminal routes
  list: publicProcedure.query(async ({ ctx }) => {
    return [];
  })
});
