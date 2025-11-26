import Dexie, { type Table } from 'dexie';
// We will assume these types exist in your bounded-contexts
// If not, we can define subsets here
import type { ChatMessage } from '@ai-workbench/bounded-contexts';

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
  // We store messages directly in the conversation for simplicity in V1
  // In V2 (RAG), we might split them out.
  messages: ChatMessage[]; 
}

export class WorkbenchDB extends Dexie {
  workspaces!: Table<DbWorkspace>;
  conversations!: Table<DbConversation>;

  constructor() {
    super('AIWorkbenchDB');
    // Define Schema
    // id is primary key
    // indexes are defined for fast searching (e.g. searching by workspaceId)
    this.version(1).stores({
      workspaces: 'id, path, lastOpened',
      conversations: 'id, workspaceId, updatedAt'
    });
  }
}

export const db = new WorkbenchDB();