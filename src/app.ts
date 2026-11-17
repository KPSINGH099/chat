import express from "express";
import chatRoutes from "./modules/chat/chat.routes.js";
import messageRoutes from "./modules/messages/message.routes.js"
import { errorMiddleware } from "./common/middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat backend is running"
  });
});

app.use("/chat", chatRoutes);
app.use("/message",messageRoutes);

// Register error handler after routes
app.use(errorMiddleware);

export default app;