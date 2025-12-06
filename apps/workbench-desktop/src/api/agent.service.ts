import { db } from './database';
import { llm, ChatMessage } from './llm.service';

export class AgentService {
  
  async replyToConversation(conversationId: string) {
    console.log(`🤖 Agent waking up for conversation: ${conversationId}`);

    // 1. Fetch Context (Last 10 messages)
    const history = db.prepare(`
      SELECT role, content FROM messages 
      WHERE conversation_id = ? 
      ORDER BY timestamp ASC 
      LIMIT 10
    `).all(conversationId) as ChatMessage[];

    // 2. Create a Placeholder Message in DB
    // We insert an empty message immediately so the UI sees "Thinking..." (or an empty bubble)
    const result = db.prepare(`
      INSERT INTO messages (conversation_id, role, content) 
      VALUES (?, 'assistant', '')
    `).run(conversationId);
    
    const messageId = result.lastInsertRowid;

    // 3. Prepare the Prompt
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `You are the AI Workbench Kernel. 
      You run inside a Linux/WSL environment. 
      You are concise, technical, and ruthless. 
      If asked to write code, provide only the code block.`
    };

    // 4. Stream the Thought
    let buffer = '';
    
    // We prepare a statement to update the DB incrementally
    const updateStmt = db.prepare('UPDATE messages SET content = ? WHERE id = ?');

    await llm.streamResponse([systemPrompt, ...history], (chunk) => {
      buffer += chunk;
      
      // OPTIMIZATION: Don't write to DB on every single byte. 
      // Write every ~50ms or every 10 chars to save disk I/O.
      // For simplicity here, we write every chunk, but WAL mode handles this well.
      updateStmt.run(buffer, messageId);
    });

    console.log(`✅ Agent finished replying.`);
  }
}

export const agent = new AgentService();