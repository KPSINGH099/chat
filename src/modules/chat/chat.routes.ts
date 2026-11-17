import { Router } from "express";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { ChatRepository } from "./chat.repository.js";

const router = Router();

// Dependency creation
const chatRepository = new ChatRepository();

const chatService = new ChatService(
  chatRepository
);

const chatController = new ChatController(
  chatService
);

// API 1: Create or get direct chat
router.post("/create", chatController.createChat);

router.get(
  "/user/:userId/chats",
  chatController.getUserChats
);

export default router;