import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  FileText,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Plus,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useDocuments, type Document } from "@/hooks/useDocuments";

interface Source {
  filename: string;
  chunkIndex: number;
  score: number;
  text: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

const API_BASE = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api");

export default function ChatPage() {
  const { documents, isLoading: docsLoading } = useDocuments();
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const readyDocs = documents.filter((d: Document) => d.status === "ready");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || selectedDocs.length === 0 || isStreaming) return;

    setError(null);
    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Add placeholder for assistant
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: trimmed,
          documentIds: selectedDocs,
          conversationId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Chat failed" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      // Read conversation ID from headers
      const newConvId = res.headers.get("x-conversation-id");
      if (newConvId) setConversationId(newConvId);

      // Parse sources from headers
      let sources: Source[] = [];
      try {
        const sourcesHeader = res.headers.get("x-sources");
        if (sourcesHeader) sources = JSON.parse(atob(sourcesHeader));
      } catch {
        // ignore parse errors
      }

      // Stream the response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // AI SDK data stream protocol: text deltas are prefixed with 0:
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              fullText += text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: fullText,
                  sources,
                };
                return updated;
              });
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }

      // Final update with sources
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: fullText,
          sources,
        };
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      // Remove empty assistant message on error
      setMessages((prev) => {
        if (prev[prev.length - 1]?.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  // No documents uploaded
  if (!docsLoading && readyDocs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h2 className="text-xl font-semibold mb-2">No Documents Yet</h2>
          <p className="text-muted-foreground mb-4">
            Upload study materials first, then come back to chat with them.
          </p>
          <Button variant="outline" onClick={() => (window.location.href = "/documents")}>
            <FileText className="h-4 w-4 mr-2" />
            Go to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar — document selector */}
      <div className="border-b p-3 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDocPicker(!showDocPicker)}
          className="gap-1"
        >
          <FileText className="h-4 w-4" />
          {selectedDocs.length
            ? `${selectedDocs.length} doc${selectedDocs.length > 1 ? "s" : ""}`
            : "Select docs"}
          <ChevronDown className="h-3 w-3" />
        </Button>

        {selectedDocs.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {selectedDocs.map((id) => {
              const doc = readyDocs.find((d: Document) => d._id === id);
              if (!doc) return null;
              return (
                <Badge key={id} variant="secondary" className="gap-1 text-xs">
                  {doc.originalName.length > 20
                    ? doc.originalName.slice(0, 20) + "..."
                    : doc.originalName}
                  <button onClick={() => toggleDoc(id)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={startNewChat} className="gap-1">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Document picker dropdown */}
      <AnimatePresence>
        {showDocPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b overflow-hidden"
          >
            <div className="p-3 grid gap-2 max-h-48 overflow-y-auto">
              {readyDocs.map((doc: Document) => (
                <label
                  key={doc._id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc._id)}
                    onChange={() => toggleDoc(doc._id)}
                    className="rounded"
                  />
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{doc.originalName}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {doc.chunkCount} chunks
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {selectedDocs.length === 0
                  ? "Select documents above, then ask a question"
                  : "Ask a question about your documents"}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
                    : "space-y-2"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <>
                    <Card className="border-0 shadow-none bg-transparent">
                      <CardContent className="p-0">
                        <div className="text-sm whitespace-pre-wrap">
                          {msg.content}
                          {isStreaming && i === messages.length - 1 && (
                            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.sources.map((src, j) => (
                          <Badge
                            key={j}
                            variant="outline"
                            className="text-xs gap-1 font-normal"
                          >
                            <FileText className="h-3 w-3" />
                            {src.filename} #{src.chunkIndex}
                            <span className="text-muted-foreground">
                              {(src.score * 100).toFixed(0)}%
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive flex items-center gap-2 border-t">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 shrink-0">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDocs.length === 0
                ? "Select documents first..."
                : "Ask about your documents..."
            }
            disabled={selectedDocs.length === 0 || isStreaming}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || selectedDocs.length === 0 || isStreaming}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
