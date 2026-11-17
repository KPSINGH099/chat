import { MessageRepository } from "./message.repository.js";

export class MessageService {

    private repository = new MessageRepository();

    async sendMessage(
        chatId: string,
        senderId: string,
        content: string
    ) {

        // 1. Check chat exists
        const chat = await this.repository.findChat(chatId);

        if (!chat) {
            throw new Error("CHAT_NOT_FOUND");
        }

        // 2. Check sender belongs to chat
        const member = await this.repository.findChatMember(
            chatId,
            senderId
        );

        if (!member) {
            throw new Error("SENDER_NOT_MEMBER");
        }

        // 3. Validate message
        if (typeof content !== "string" || !content.trim()) {
            throw new Error("MESSAGE_REQUIRED");
        }

        if (content.trim().length > 5000) {
            throw new Error("MESSAGE_TOO_LONG");
        }

        // 4. Generate ID
        // 5. Save message in Firestore
        const savedMessage = await this.repository.saveMessage(
            chatId,
            senderId,
            content.trim()
        );

        // 6. Return saved message
        return savedMessage;
    }

    async getMessages(
    chatId: string,
    senderId: string,
    limit: number
) {

    // 1. Check whether chat exists
    const chat = await this.repository.findChat(chatId);

    if (!chat) {
        throw new Error("CHAT_NOT_FOUND");
    }

    // 2. Check whether sender belongs to chat
    const member = await this.repository.findChatMember(
        chatId,
        senderId
    );

    if (!member) {
        throw new Error("SENDER_NOT_MEMBER");
    }

    // 3. Validate limit
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("INVALID_LIMIT");
    }

    // 4. Fetch messages from Firestore
    const messages = await this.repository.getMessages(
        chatId,
        limit
    );

    // 5. Return messages
    return {
        chatId,
        messages,
        limit,
        count: messages.length
    };
}

async markMessageRead(
    chatId: string,
    messageId: string,
    userId: string
) {

    // 1. Check chat exists
    const chat = await this.repository.findChat(chatId);

    if (!chat) {
        throw new Error("CHAT_NOT_FOUND");
    }

    // 2. Check user belongs to chat
    const member = await this.repository.findChatMember(
        chatId,
        userId
    );

    if (!member) {
        throw new Error("USER_NOT_MEMBER");
    }

    // 3. Mark message as read in Firestore
    const receipt = await this.repository.markMessageRead(
        chatId,
        messageId,
        userId
    );

    // 4. Return receipt
    return receipt;
}

async updateLastSeen(
  chatId: string,
  messageId: string,
  userId: string
) {

  // 1. Validate input
  if (!chatId || !messageId || !userId) {
    throw new Error("INVALID_INPUT");
  }

  // 2. Check whether chat exists
  const chat = await this.repository.findChat(chatId);

  if (!chat) {
    throw new Error("CHAT_NOT_FOUND");
  }

  // 3. Check whether user belongs to chat
  const member = await this.repository.findChatMember(
    chatId,
    userId
  );

  if (!member) {
    throw new Error("USER_NOT_MEMBER");
  }

  // 4. Update last seen in Firestore
  const result = await this.repository.updateLastSeen(
    chatId,
    messageId,
    userId
  );

  // 5. Return result
  return {
    chatId,
    ...result
  };
}
}