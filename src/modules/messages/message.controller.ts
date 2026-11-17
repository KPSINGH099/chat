import { Request, Response } from "express";
import { MessageService } from "./message.service.js";

export class MessageController {

    private service = new MessageService();

    sendMessage = async (req: Request, res: Response) => {

        try {

            const chatId = Array.isArray(req.params.chatId)
                ? req.params.chatId[0]
                : req.params.chatId;

            const senderId = req.header("senderId");

            const { content } = req.body;

            // Validate header
            if (!senderId) {
                return res.status(400).json({
                    success: false,
                    message: "senderId header is required"
                });
            }

            const savedMessage = await this.service.sendMessage(
                chatId,
                senderId,
                content
            );

            return res.status(201).json({
                success: true,
                message: "Message sent successfully",
                data: savedMessage
            });

        } catch (error: any) {

            if (error.message === "CHAT_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Chat not found"
                });
            }

            if (error.message === "SENDER_NOT_MEMBER") {
                return res.status(403).json({
                    success: false,
                    message: "Sender does not belong to this chat"
                });
            }

            if (error.message === "MESSAGE_REQUIRED") {
                return res.status(400).json({
                    success: false,
                    message: "Message content is required"
                });
            }

            if (error.message === "MESSAGE_TOO_LONG") {
                return res.status(400).json({
                    success: false,
                    message: "Message cannot exceed 5000 characters"
                });
            }

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    };

    getMessages = async (req: Request, res: Response) => {

    try {

        const chatId = Array.isArray(req.params.chatId)
            ? req.params.chatId[0]
            : req.params.chatId;

        const senderId = req.header("senderId");

        const limit = req.query.limit === undefined
            ? 50
            : Number(req.query.limit);

        if (!senderId) {
            return res.status(400).json({
                success: false,
                message: "senderId header is required"
            });
        }

        const result = await this.service.getMessages(
            chatId,
            senderId,
            limit
        );

        return res.status(200).json({
            success: true,
            message: "Messages fetched successfully",
            data: result
        });

    } catch (error: any) {

        if (error.message === "CHAT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        if (error.message === "SENDER_NOT_MEMBER") {
            return res.status(403).json({
                success: false,
                message: "Sender does not belong to this chat"
            });
        }

        if (error.message === "INVALID_LIMIT") {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 100"
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

markMessageRead = async (req: Request, res: Response) => {

    try {

        const chatId = Array.isArray(req.params.chatId)
            ? req.params.chatId[0]
            : req.params.chatId;
        const messageId = Array.isArray(req.params.messageId)
            ? req.params.messageId[0]
            : req.params.messageId;

        const { userId } = req.body;

        // Validate userId
        if (!userId || typeof userId !== "string") {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            });
        }

        const receipt = await this.service.markMessageRead(
            chatId,
            messageId,
            userId
        );

        return res.status(200).json({
            success: true,
            message: "Message marked as read",
            data: {
                chatId,
                messageId,
                ...receipt
            }
        });

    } catch (error: any) {

        if (error.message === "CHAT_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        if (error.message === "USER_NOT_MEMBER") {
            return res.status(403).json({
                success: false,
                message: "User does not belong to this chat"
            });
        }

        if (error.message === "MESSAGE_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

updateLastSeen = async (req: Request, res: Response) => {

  try {

    const chatId = Array.isArray(req.params.chatId)
      ? req.params.chatId[0]
      : req.params.chatId;

    const { userId, messageId } = req.body;

    // Validate input
    if (
      !userId ||
      typeof userId !== "string" ||
      !messageId ||
      typeof messageId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "userId and messageId are required"
      });
    }

    // Call service
    const result = await this.service.updateLastSeen(
      chatId,
      messageId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Last seen updated successfully",
      data: result
    });

  } catch (error: any) {

    if (error.message === "INVALID_INPUT") {
      return res.status(400).json({
        success: false,
        message: "Invalid input"
      });
    }

    if (error.message === "CHAT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    if (error.message === "USER_NOT_MEMBER") {
      return res.status(403).json({
        success: false,
        message: "User does not belong to this chat"
      });
    }

    if (error.message === "MESSAGE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    if (error.message === "MESSAGE_TIMESTAMP_MISSING") {
      return res.status(422).json({
        success: false,
        message: "Message timestamp is missing"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
}