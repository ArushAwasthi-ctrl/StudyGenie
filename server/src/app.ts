import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import { getRedis } from "./config/redis.js";
import { verifyQdrant } from "./config/qdrant.js";

import authRoutes from "./routes/auth.routes.js";
import documentRoutes from "./routes/document.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL
    : "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function start() {
  try {
    await connectDB();
    getRedis();
    await verifyQdrant();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
