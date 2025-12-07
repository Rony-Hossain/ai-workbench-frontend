import { router, publicProcedure } from '@ai-workbench/shared/trpc-server';

export const chatRouter = router({
  // TODO: Implement chat routes
  list: publicProcedure.query(async ({ ctx }) => {
    return [];
  })
});
