export interface SendMessageRequest {
    content: string;
}

export interface MessageDocument {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    type: "TEXT";
    createdAt: FirebaseFirestore.Timestamp;
    updatedAt: FirebaseFirestore.Timestamp;
    isDeleted: boolean;
}