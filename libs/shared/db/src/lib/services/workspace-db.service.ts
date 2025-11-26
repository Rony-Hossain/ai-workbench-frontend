import { db, DbWorkspace } from '../db.config';

export const workspaceDb = {
  // Add or Update a workspace
  upsert: async (workspace: Omit<DbWorkspace, 'lastOpened'>) => {
    return await db.workspaces.put({
      ...workspace,
      lastOpened: Date.now()
    });
  },

  // Get recent workspaces
  getRecents: async (limit = 5) => {
    return await db.workspaces
      .orderBy('lastOpened')
      .reverse()
      .limit(limit)
      .toArray();
  },

  // Get specific workspace
  get: async (id: string) => {
    return await db.workspaces.get(id);
  }
};