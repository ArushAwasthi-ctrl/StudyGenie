import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { chatMessageSchema } from "../schemas/document.schema.js";
import { ragChat } from "../services/rag.service.js";
import { Conversation } from "../models/Conversation.js";

const router = Router();

// POST /api/chat — Streaming RAG chat
router.post("/", authenticate, async (req: Request, res: Response) => {
  console.log("[Chat] Request received:", { userId: req.userId, body: req.body });
  try {
    const parsed = chatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { message, documentIds, conversationId } = parsed.data;

    const result = await ragChat({
      userId: req.userId!,
      message,
      documentIds,
      conversationId,
    });

    // Set headers for streaming + metadata
    res.setHeader("x-conversation-id", result.conversationId);
    res.setHeader("x-trace-id", result.traceId);
    // Encode sources as base64 to avoid invalid header characters
    res.setHeader("x-sources", Buffer.from(JSON.stringify(result.sources)).toString("base64"));

    // Pipe the AI SDK stream to the response
    result.stream.pipeDataStreamToResponse(res);
  } catch (error) {
    console.error("Chat error:", error instanceof Error ? error.stack : error);
    if (!res.headersSent) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process chat message" });
    }
  }
});

// GET /api/chat/conversations — List user's conversations
router.get("/conversations", authenticate, async (req: Request, res: Response) => {
  try {
    const conversations = await Conversation.find({ userId: req.userId })
      .select("title documentIds createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json(conversations);
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// GET /api/chat/:conversationId/history — Get conversation messages
router.get("/:conversationId/history", authenticate, async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      userId: req.userId,
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({
      id: conversation._id,
      title: conversation.title,
      documentIds: conversation.documentIds,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ error: "Failed to get conversation history" });
  }
});

// DELETE /api/chat/:conversationId — Delete a conversation
router.delete("/:conversationId", authenticate, async (req: Request, res: Response) => {
  try {
    const result = await Conversation.findOneAndDelete({
      _id: req.params.conversationId,
      userId: req.userId,
    });

    if (!result) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;
