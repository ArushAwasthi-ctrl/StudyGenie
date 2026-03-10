# StudyGenie

**AI-powered study platform with streaming RAG chat, adaptive mock interviews, and structured quiz evaluation.**

Upload your documents, and StudyGenie helps you learn from them — ask questions with cited answers, take AI-generated quizzes with LLM-as-judge scoring, or practice with an adaptive mock interviewer that follows up on your weak points.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, shadcn/ui, Motion |
| Backend | Express 5, TypeScript |
| AI | Vercel AI SDK v6, Groq (Llama 3.3 70B), Gemini (embeddings) |
| Auth | Better Auth (cookie-based sessions) |
| Payments | Polar (hosted checkout, subscriptions) |
| Database | MongoDB Atlas |
| Vector DB | Qdrant Cloud (3072-dim, cosine distance) |
| Cache | Upstash Redis |

---

## Features

### RAG Chat with Citations
Upload PDFs, markdown, or text files. Ask questions and get streaming answers grounded in your documents with source citations. Chunks are retrieved via semantic search (top-5, 0.3 threshold) and injected into a RAG prompt with citation rules.

### AI Quiz Generator
Generate MCQ, true/false, and open-ended quizzes from your uploaded material. MCQ/true-false use exact matching. Open-ended answers are scored 1-5 using an **LLM-as-judge** pattern that identifies key points covered and missed.

### Adaptive Mock Interviewer
A **turn-by-turn agent** that reads your documents, asks contextual questions, evaluates answers, and adapts in real-time:
- Score <= 3 on a question → follow-up probing the specific weak points
- Score > 3 → moves to a new topic from your documents
- Generates a structured session report with scores, strong/weak areas, and study recommendations

### Dashboard
Track quiz scores, interview performance, weak/strong topics, and score trends over time.

### Production Hardening
- **Semantic caching** — Qdrant-based similarity lookup (0.95 threshold) to skip redundant LLM calls
- **Circuit breaker** — auto-failover from Groq to Gemini after 3 consecutive failures
- **Rate limiting** — Redis fixed-window counters per user per feature
- **Input guardrails** — prompt injection detection (13 regex patterns) + length/spam checks
- **Output guardrails** — PII redaction (emails, phones, SSNs, credit cards)
- **Observability** — traceId (UUID) on every LLM call with token counts, latency, and cost estimates

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENT (React 19 + Vite 6)                     │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ RAG Chat │  │ AI Quiz  │  │  Mock    │  │    Dashboard      │  │
│  │  Page    │  │  Page    │  │Interview │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │             │                  │             │
│  ┌────┴──────────────┴─────────────┴──────────────────┴──────────┐  │
│  │              Vercel AI SDK / fetch + SSE streaming             │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTP / SSE
┌─────────────────────────────┼───────────────────────────────────────┐
│                         SERVER (Express 5)                          │
│                              │                                      │
│  ┌───────────────────────────┴────────────────────────────────────┐  │
│  │                     Middleware Pipeline                        │  │
│  │  cookieParser → auth → rateLimit → inputGuardrail → routes    │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────┐  ┌────────────┴───────────┐  ┌───────────────────┐  │
│  │  RAG      │  │   AI Services          │  │  Interview Agent  │  │
│  │  Pipeline │  │  (Vercel AI SDK v6)    │  │  (4 tools,        │  │
│  │  embed →  │  │  streamText()          │  │   turn-by-turn)   │  │
│  │  retrieve │  │  generateObject()      │  │                   │  │
│  │  → prompt │  │  embed() / embedMany() │  │                   │  │
│  └─────┬─────┘  └────────────┬───────────┘  └────────┬──────────┘  │
│        │                     │                        │             │
│  ┌─────┴─────────────────────┴────────────────────────┴──────────┐  │
│  │                   Production Layer                            │  │
│  │  Semantic Cache │ Circuit Breaker │ Output Guardrail │ Logger │  │
│  └───────────────────────────┬────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────┴──────┐   ┌────────┴───────┐   ┌───────┴───────┐
   │  MongoDB    │   │  Qdrant Cloud  │   │ Upstash Redis │
   │  Atlas      │   │  (Vectors +    │   │  (Rate Limit  │
   │  (Users,    │   │   Semantic     │   │   Counters)   │
   │   Docs,     │   │   Cache)       │   │               │
   │   Quizzes,  │   │  3072-dim      │   │               │
   │   Sessions) │   │  cosine dist.  │   │               │
   └─────────────┘   └────────────────┘   └───────────────┘
```

### RAG Chat Flow
```
User query → Semantic Cache check (cosine >= 0.95)
  ├── Cache hit → return cached response
  └── Cache miss → embed query → Qdrant search (top-5 chunks)
      → Build RAG prompt with citations → streamText() via Groq
      → Output guardrail (PII redaction) → SSE stream to client
      → Cache response for future queries
```

### Mock Interview Agent Flow
```
POST /interview/start → retrieve context → generate first question → save session
     ↓
POST /interview/answer → evaluateAnswer (LLM-as-judge, score 1-5)
     ├── Score ≤ 3 → generateFollowUp (probe weak points)
     ├── Score > 3 → searchDocs + generateQuestion (new topic)
     └── All rounds done → generateSessionReport (structured result)
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/documents/upload` | Upload + chunk + embed documents |
| GET | `/api/documents` | List user's documents |
| DELETE | `/api/documents/:id` | Delete document + vectors |
| POST | `/api/chat` | Streaming RAG chat (SSE) |
| GET | `/api/chat/:id/history` | Conversation history |
| POST | `/api/quiz/generate` | Generate quiz from documents |
| POST | `/api/quiz/evaluate` | Score answers (LLM-as-judge) |
| GET | `/api/quiz/history` | Past quiz results |
| POST | `/api/interview/start` | Start mock interview session |
| POST | `/api/interview/answer` | Submit answer, get next question |
| POST | `/api/interview/end` | End session, get report |
| GET | `/api/dashboard/stats` | User stats and analytics |

---

## Key Architectural Patterns

| Pattern | Where | What It Does |
|---------|-------|-------------|
| **RAG** | Chat | Retrieve relevant chunks, inject as context, stream response |
| **Structured Output** | Quiz, Interview | `generateObject({ schema })` with Zod for type-safe LLM responses |
| **LLM-as-Judge** | Quiz eval, Interview eval | LLM scores answers against rubric, identifies covered/missed points |
| **Turn-by-Turn Agent** | Mock Interview | State persisted in MongoDB, one evaluate+generate step per request |
| **Circuit Breaker** | All AI calls | CLOSED → OPEN (after 3 failures) → HALF_OPEN (after 60s cooldown) |
| **Semantic Cache** | Chat | Qdrant cosine similarity on query embeddings to skip LLM |
| **Recursive Chunking** | Document upload | Split by `\n\n` → `\n` → `. ` → ` ` with 200-char overlap |
| **Input Guardrails** | All AI routes | 13 regex patterns for prompt injection + length + spam detection |
| **Output Guardrails** | Chat | PII redaction (email, phone, SSN, credit card) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Qdrant Cloud account (free tier)
- Upstash Redis account (free tier)
- Groq API key (free tier)
- Google Gemini API key (free tier)

### Environment Variables

Create `.env` in both `server/` and `client/`:

**Server `.env`:**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
QDRANT_URL=https://...
QDRANT_API_KEY=...
REDIS_URL=redis://...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:5000
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=...
```

**Client `.env`:**
```
VITE_API_URL=http://localhost:5000
```

### Install & Run

```bash
# Server
cd server
npm install
npm run dev

# Client (separate terminal)
cd client
npm install
npm run dev
```

---

## Project Structure

```
├── server/
│   └── src/
│       ├── config/          # DB, Redis, Qdrant, AI providers, auth
│       ├── middleware/       # Auth, rate limiting, input/output guardrails
│       ├── models/          # Mongoose schemas (Document, Conversation, QuizResult, InterviewSession)
│       ├── schemas/         # Zod validation (API inputs + LLM outputs)
│       ├── services/        # Business logic (RAG, quiz, interview, cache, embedding)
│       ├── tools/           # Agent tools (generateQuestion, evaluateAnswer, generateFollowUp, searchDocs)
│       ├── rag/             # Chunker, retriever, prompt templates
│       ├── routes/          # Express route handlers
│       └── utils/           # Cosine similarity, circuit breaker
│
├── client/
│   └── src/
│       ├── components/      # shadcn/ui primitives, layout, auth forms
│       ├── pages/           # Chat, Documents, Quiz, Interview, Dashboard
│       ├── hooks/           # useAuth, useTheme, useDocuments
│       └── lib/             # API client, auth client, utilities
```

---

## Core Concepts Implemented

| Concept | Feature |
|---------|---------|
| Zod + Structured Output | Input validation + `generateObject()` with typed schemas |
| Prompt Engineering | RAG prompts, interview personas, evaluation rubrics |
| Streaming | SSE chat with `streamText()` + `pipeDataStreamToResponse()` |
| Conversation Memory | Multi-turn chat with sliding window (last 10 messages) |
| Embeddings + Vector Search | Document embedding + Qdrant semantic search |
| RAG Architecture | Full pipeline: chunk → embed → retrieve → prompt → stream |
| Function Calling | 4 agent tools with Zod-typed parameters |
| AI Agents | Turn-by-turn mock interviewer with adaptive follow-ups |
| Production Hardening | Caching, circuit breaker, rate limiting, guardrails |
