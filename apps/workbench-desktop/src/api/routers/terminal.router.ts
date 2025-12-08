import { router, publicProcedure } from '../trpc/init';

export const terminalRouter = router({
  // TODO: Implement terminal routes
  list: publicProcedure.query(async ({ ctx }) => {
    return [];
  })
});
