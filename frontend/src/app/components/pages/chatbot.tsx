import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I'm your AI note assistant. Ask me anything — I'll search through your actual notes to answer. Try asking about topics you've written about!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await api.notes.ask(query);
      const aiMsg: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "assistant",
          content: "Sorry, I ran into an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "What topics have I written about?",
    "Summarize my notes on AI",
    "What did I write about last?",
    "Find notes related to machine learning",
  ];

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">AI Chatbot</h1>
        <p className="text-gray-300">
          Ask questions and get answers grounded in your real notes
        </p>
      </div>

      <Card className="flex-1 flex flex-col border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <CardContent className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-teal-600"
                    : "bg-gradient-to-br from-cyan-500 to-teal-500"
                }`}
              >
                {message.role === "user" ? (
                  <User className="size-5 text-white" />
                ) : (
                  <Bot className="size-5 text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-white/10 text-gray-100"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="mt-1 text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500">
                <Bot className="size-5 text-white" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/10 text-gray-100 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Searching your notes...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        {messages.length <= 2 && (
          <div className="border-t border-white/10 px-6 py-3">
            <p className="mb-2 text-xs text-gray-400">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  onClick={() => setInput(q)}
                  className="border-white/20 bg-transparent text-cyan-400 text-xs hover:bg-white/10"
                >
                  <Sparkles className="mr-1 size-3" />
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask me anything about your notes..."
              className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}