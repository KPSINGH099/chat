import { ChatRepository } from "./chat.repository.js";

import type {
  Chat,
  CreateDirectChatInput
  ,UserChat
} from "./chat.model.js";

export class ChatService {

  constructor(
    private readonly chatRepository: ChatRepository
  ) {}

  async createOrGetDirectChat(
    input: CreateDirectChatInput
  ): Promise<Chat> {

    const { senderId, receiverId } = input;

    // 1. Basic input validation
    if (!senderId || !receiverId) {
      throw new Error("Both senderId and receiverId are required");
    }

    if (senderId === receiverId) {
      throw new Error("Cannot create a chat with yourself");
    }

    // 2. Generate a consistent key.
    const directKey = this.generateDirectKey(
      senderId,
      receiverId
    );

    // 3. Delegate database work to repository.
    return this.chatRepository.createOrGetDirectChat(
      senderId,
      receiverId,
      directKey
    );
  }

  private generateDirectKey(
    senderId: string,
    receiverId: string
  ): string {

    // Sorting ensures both request directions
    // generate the same key.
    return JSON.stringify(
      [senderId, receiverId].sort()
    );
  }

  async getUserChats(userId: string): Promise<UserChat[]> {

  if (!userId) {
    throw new Error("User ID is required");
  }

  return this.chatRepository.getUserChats(userId);
}
}