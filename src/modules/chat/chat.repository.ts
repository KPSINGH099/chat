import { pool } from "../../config/database.js";
import type { PoolClient } from "pg";
import type { Chat,UserChat } from "./chat.model.js";

export class ChatRepository {

  async createOrGetDirectChat(
    senderId: string,
    receiverId: string,
    directKey: string
  ): Promise<Chat> {

    const client: PoolClient = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. Try to create a new direct chat.
      // If another request already created it,
      // the unique index prevents a duplicate.
      const insertResult = await client.query<Chat>(
        `INSERT INTO chats (type, direct_key)
         VALUES ($1, $2)
         ON CONFLICT (direct_key) WHERE type = 'DIRECT'
         DO NOTHING
         RETURNING id, type, direct_key, created_at`,
        ["DIRECT", directKey]
      );

      let chat: Chat;

      if (insertResult.rows.length > 0) {
        // Newly created chat
        chat = insertResult.rows[0]!;
      } else {
        // Existing chat
        const existingResult = await client.query<Chat>(
          `SELECT id, type, direct_key, created_at
           FROM chats
           WHERE direct_key = $1
             AND type = 'DIRECT'`,
          [directKey]
        );

        if (existingResult.rows.length === 0) {
          throw new Error("Unable to create or find chat");
        }

        chat = existingResult.rows[0]!;
      }

      // 2. Add both participants.
      // ON CONFLICT prevents duplicate memberships.
      await client.query(
        `INSERT INTO chat_members (chat_id, user_id)
         VALUES ($1, $2), ($1, $3)
         ON CONFLICT (chat_id, user_id) DO NOTHING`,
        [chat.id, senderId, receiverId]
      );

      // 3. Commit both operations together.
      await client.query("COMMIT");

      return chat;

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;

    } finally {
      client.release();
    }
  }

  async getUserChats(userId: string): Promise<UserChat[]> {

  const query = `
    SELECT
      c.id AS chat_id,
      c.type,
      c.created_at,
      ARRAY(
        SELECT cm2.user_id
        FROM chat_members cm2
        WHERE cm2.chat_id = c.id
        ORDER BY cm2.joined_at ASC
      ) AS member_ids

    FROM chats c

    WHERE EXISTS (
      SELECT 1
      FROM chat_members cm
      WHERE cm.chat_id = c.id
      AND cm.user_id = $1
    )

    ORDER BY c.created_at DESC;
  `;

  const result = await pool.query(query, [userId]);

  return result.rows.map((row) => ({
    chatId: row.chat_id,
    type: row.type,
    memberIds: row.member_ids,
    createdAt: row.created_at
  }));
}
}