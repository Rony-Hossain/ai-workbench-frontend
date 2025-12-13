import { initTRPC } from '@trpc/server';
import type { AppContext } from './context';
import superjson from 'superjson'; // <--- IMPORT THIS

// FIX: Add the transformer here to match the frontend configuration
const t = initTRPC.context<AppContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure;