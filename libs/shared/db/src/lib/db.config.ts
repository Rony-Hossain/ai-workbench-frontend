export interface DbWorkspace {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
}

export interface DbConversation {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: any[]; 
}

// Mock DB Object to satisfy existing imports
export const db = {
  workspaces: {
    put: async () => {},
    orderBy: () => ({ reverse: () => ({ limit: () => ({ toArray: async () => [] }) }) }),
    get: async () => null
  },
  conversations: {
    add: async () => {},
    where: () => ({ equals: () => ({ reverse: () => ({ sortBy: async () => [] }) }) }),
    update: async () => {},
    get: async () => null
  }
};