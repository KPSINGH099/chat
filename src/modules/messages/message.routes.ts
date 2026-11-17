import { Router } from "express";

import { MessageController } from "./message.controller.js";

const router = Router();

const controller = new MessageController();

router.post(
    "/:chatId/message/send",
    controller.sendMessage
);

router.get(
    "/:chatId/messages",
    controller.getMessages
);

router.post(
    "/:chatId/message/:messageId/read",
    controller.markMessageRead
);

router.post(
  "/chat/:chatId/lastseen",
  controller.updateLastSeen
);

export default router;