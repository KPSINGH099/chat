import type { Request, Response } from "express";
import { ChatService } from "./chat.service.js";

export class ChatController {

  constructor(
    private readonly chatService: ChatService
  ) {}

  createChat = async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const { senderId, receiverId } = req.body;

    const chat = await this.chatService.createOrGetDirectChat({
      senderId,
      receiverId
    });

    res.status(200).json({
      success: true,
      message: "Chat created or retrieved successfully",
      data: {
        chatId: chat.id
      }
    });
  };

  getUserChats = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    if (typeof userId !== "string" || !userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const chats = await this.chatService.getUserChats(userId);

    return res.status(200).json({
      success: true,
      count: chats.length,
      chats
    });

  } catch (error) {
    console.error("Get user chats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user chats"
    });
  }
};
}