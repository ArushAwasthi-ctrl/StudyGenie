import { Link } from "react-router";
import { motion } from "motion/react";
import { MessageSquare, HelpCircle, Code2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "../hooks/useTheme.js";

const features = [
  {
    icon: MessageSquare,
    title: "RAG Chat",
    description: "Upload documents and chat with your study materials. AI-powered answers with citations.",
  },
  {
    icon: HelpCircle,
    title: "AI Quiz",
    description: "Generate quizzes from your content. LLM-as-judge evaluates open-ended answers.",
  },
  {
    icon: Code2,
    title: "Code Review",
    description: "Multi-tool AI agent analyzes your code for quality, security, and best practices.",
  },
];

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="group relative min-h-screen bg-background overflow-hidden">
      {/* Spotlight gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 dark:opacity-30 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--chart-1) / 0.3), transparent)",
        }}
      />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-primary via-chart-3 to-chart-1 bg-clip-text text-transparent">
              StudyGenie
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-2">
            Your AI-Powered Study Platform
          </p>
          <p className="text-muted-foreground/60 mb-10 max-w-lg mx-auto">
            Upload documents, chat with AI, generate quizzes, and get code reviews — all powered by streaming RAG and multi-tool agents.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex gap-4"
        >
          <Button asChild size="lg">
            <Link to="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Sign In</Link>
          </Button>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.15, ease: "easeOut" }}
              whileHover={{ scale: 1.03, y: -4 }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech Stack Footer */}
      <div className="relative z-10 text-center pb-12">
        <p className="text-sm text-muted-foreground/50">
          Built with React &bull; TypeScript &bull; Vercel AI SDK &bull; MongoDB &bull; Qdrant &bull; Redis
        </p>
      </div>
    </div>
  );
}
