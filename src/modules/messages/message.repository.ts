import { pool } from "../../config/database.js";
import { firestore } from "../../config/firebase.js";
import { Timestamp, FieldPath, FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

export class MessageRepository {

    // Check whether chat exists
    async findChat(chatId: string) {

        const result = await pool.query(
            `SELECT id FROM chats WHERE id = $1`,
            [chatId]
        );

        return result.rows[0] || null;
    }

    // Check whether sender belongs to chat
    async findChatMember(chatId: string, senderId: string) {

        const result = await pool.query(
            `SELECT id
             FROM chat_members
             WHERE chat_id = $1
             AND user_id = $2`,
            [chatId, senderId]
        );

        return result.rows[0] || null;
    }

    // Save message in Firestore
    async saveMessage(
        chatId: string,
        senderId: string,
        content: string
    ) {

        const messageId = randomUUID();

        const message = {
            id: messageId,
            chatId,
            senderId,
            content,
            type: "TEXT",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            isDeleted: false
        };

        await firestore
            .collection("chats")
            .doc(chatId)
            .collection("messages")
            .doc(messageId)
            .set(message);

        return message;
    }

    // Fetch messages from Firestore
async getMessages(chatId: string, limit: number) {

    const snapshot = await firestore
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(limit)
        .get();

    // Convert Firestore documents into objects
    // Reverse to display oldest first
    return snapshot.docs
        .map(doc => doc.data())
        .reverse();
}

// Mark message as read
async markMessageRead(
    chatId: string,
    messageId: string,
    userId: string
) {

    const messageRef = firestore
        .collection("chats")
        .doc(chatId)
        .collection("messages")
        .doc(messageId);

    const receiptRef = messageRef
        .collection("readReceipts")
        .doc(userId);

    return await firestore.runTransaction(async (transaction) => {

        // Check whether message exists
        const messageSnapshot = await transaction.get(messageRef);

        if (!messageSnapshot.exists) {
            throw new Error("MESSAGE_NOT_FOUND");
        }

        // Check whether user has already read this message
        const receiptSnapshot = await transaction.get(receiptRef);

        if (receiptSnapshot.exists) {
            return receiptSnapshot.data();
        }

        // Create read receipt
        const receipt = {
            userId,
            readAt: Timestamp.now()
        };

        transaction.set(receiptRef, receipt);

        return receipt;
    });
}

// Update last seen message
async updateLastSeen(
  chatId: string,
  messageId: string,
  userId: string
) {

  const chatRef = firestore
    .collection("chats")
    .doc(chatId);

  const messageRef = chatRef
    .collection("messages")
    .doc(messageId);

  const lastSeenRef = chatRef
    .collection("lastSeen")
    .doc(userId);

  return await firestore.runTransaction(async (transaction) => {

    // 1. Fetch requested message
    const messageSnapshot = await transaction.get(messageRef);

    if (!messageSnapshot.exists) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    const incomingCreatedAt =
      messageSnapshot.get("createdAt") as Timestamp;

    if (!incomingCreatedAt) {
      throw new Error("MESSAGE_TIMESTAMP_MISSING");
    }

    // 2. Fetch existing last-seen document
    const lastSeenSnapshot = await transaction.get(lastSeenRef);

    // 3. Compare with existing last-seen position
    if (lastSeenSnapshot.exists) {

      const currentMessageId =
        lastSeenSnapshot.get("messageId") as string;

      let currentCreatedAt =
        lastSeenSnapshot.get("messageCreatedAt") as Timestamp | undefined;

      // Backward compatibility for older lastSeen documents
      if (!currentCreatedAt && currentMessageId) {

        const currentMessageRef = chatRef
          .collection("messages")
          .doc(currentMessageId);

        const currentMessageSnapshot =
          await transaction.get(currentMessageRef);

        if (currentMessageSnapshot.exists) {
          currentCreatedAt =
            currentMessageSnapshot.get("createdAt") as Timestamp;
        }
      }

      if (currentCreatedAt) {

        const incomingTime = incomingCreatedAt.toMillis();
        const currentTime = currentCreatedAt.toMillis();

        // Same ordering as getMessages():
        // createdAt DESC, documentId DESC

        const incomingIsOlder =
          incomingTime < currentTime ||
          (
            incomingTime === currentTime &&
            messageId.localeCompare(currentMessageId) < 0
          );

        if (incomingIsOlder) {
          return {
            userId,
            messageId: currentMessageId,
            status: "UNCHANGED"
          };
        }
      }
    }

    // 4. Update last-seen document
    transaction.set(lastSeenRef, {
      userId,
      messageId,
      messageCreatedAt: incomingCreatedAt,
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      userId,
      messageId,
      status: "UPDATED"
    };
  });
}
}