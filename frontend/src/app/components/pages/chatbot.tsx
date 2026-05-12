import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your AI note assistant. I can help you find notes, summarize content, or answer questions based on your knowledge base. How can I help?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.notes.ask(query);
      const aiMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: typeof response === 'string' ? response : (response.answer || JSON.stringify(response)),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get a response from the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'What did i write about Technology?',
    'Summarize my recent notes.',
    'What are the key takeaways from my notes?',
  ];

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl text-white">Smart Search</h1>
        <p className="text-gray-300">
          Ask questions about your notes and get instant AI-powered answers
        </p>
      </div>

      <Card className="flex-1 flex flex-col border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <CardContent className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-teal-600'
                    : 'bg-gradient-to-br from-cyan-500 to-teal-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="size-5 text-white" />
                ) : (
                  <Bot className="size-5 text-white" />
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-teal-600 text-white ml-auto'
                      : 'bg-white/10 text-gray-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-1 text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500">
                <Bot className="size-5 text-white" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/10 text-gray-100 flex items-center">
                <p className="text-sm animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        {messages.length <= 2 && (
          <div className="border-t border-white/10 px-6 py-3">
            <p className="mb-2 text-xs text-gray-400">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant="outline"
                  onClick={() => setInput(question)}
                  className="border-white/20 bg-transparent text-cyan-400 text-xs hover:bg-white/10"
                >
                  <Sparkles className="mr-1 size-3" />
                  {question}
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your notes..."
              className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
            <Button
              variant="default"
              onClick={handleSend}
              disabled={isLoading}
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