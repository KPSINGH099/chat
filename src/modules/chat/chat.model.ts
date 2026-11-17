export type ChatType = "DIRECT" | "GROUP";

export interface Chat {
  id: string;
  type: ChatType;
  direct_key: string | null;
  created_at: Date;
}

export interface CreateDirectChatInput {
  senderId: string;
  receiverId: string;
}

export interface UserChat {
  chatId: string;
  type: ChatType;
  memberIds: string[];
  createdAt: Date;
}