import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from './database';

const t = initTRPC.create({ isServer: true });

export const appRouter = t.router({
  // 1. Health Check (Keep this)
  getSystemStatus: t.procedure.query(() => {
    return { status: 'ONLINE', mode: 'WSL-NATIVE' };
  }),

  // 2. Load Conversation History
  getHistory: t.procedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => {
      // Get messages for this conversation
      const stmt = db.prepare(`
        SELECT * FROM messages 
        WHERE conversation_id = ? 
        ORDER BY timestamp ASC
      `);
      return stmt.all(input.conversationId);
    }),

  // 3. The Core Loop: User talks, System saves
  sendMessage: t.procedure
    .input(z.object({
      conversationId: z.string(),
      content: z.string(),
      role: z.enum(['user', 'assistant'])
    }))
    .mutation(({ input }) => {
      const { conversationId, content, role } = input;

      // A. Ensure Conversation Exists
      const check = db.prepare('SELECT id FROM conversations WHERE id = ?');
      if (!check.get(conversationId)) {
        db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)')
          .run(conversationId, 'New Session');
      }

      // B. Insert Message
      const insert = db.prepare(`
        INSERT INTO messages (conversation_id, role, content) 
        VALUES (?, ?, ?)
      `);
      insert.run(conversationId, role, content);

      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;