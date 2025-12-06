import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import superjson from 'superjson';
import { db } from './database';
// 1. IMPORT THE BRAIN
import { agent } from './agent.service';

const t = initTRPC.create({ isServer: true, transformer: superjson });

export const appRouter = t.router({
  // 1. Health Check
  getSystemStatus: t.procedure.query(() => {
    return { status: 'ONLINE', mode: 'WSL-NATIVE' };
  }),

  // 2. Load Conversation History
  getHistory: t.procedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => {
      const stmt = db.prepare(`
        SELECT * FROM messages 
        WHERE conversation_id = ? 
        ORDER BY timestamp ASC
      `);
      return stmt.all(input.conversationId);
    }),

  // 3. The Core Loop
  sendMessage: t.procedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string(),
        role: z.enum(['user', 'assistant']),
      })
    )
    .mutation(async ({ input }) => {
      // <--- MARK AS ASYNC
      const { conversationId, content, role } = input;

      // A. Ensure Conversation Exists
      const check = db.prepare('SELECT id FROM conversations WHERE id = ?');
      if (!check.get(conversationId)) {
        db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(
          conversationId,
          'New Session'
        );
      }

      // B. Insert User Message
      const insert = db.prepare(`
        INSERT INTO messages (conversation_id, role, content) 
        VALUES (?, ?, ?)
      `);
      insert.run(conversationId, role, content);

      // C. TRIGGER THE AGENT (Fire and Forget)
      // If the USER spoke, the AGENT must reply.
      if (role === 'user') {
        // We do not 'await' this. We let it run in the background.
        // This keeps the UI snappy.
        agent.replyToConversation(conversationId).catch((err) => {
          console.error('🔥 Agent Failed to start:', err);
        });
      }

      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
