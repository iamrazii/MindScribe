import React, { useState } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI note assistant. I can help you find notes, summarize content, or answer questions about your notes. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const getAIResponse = (question: string) => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('note') && lowerQuestion.includes('how many')) {
      return 'You currently have 24 notes in your collection. 12 of them were created this week!';
    } else if (lowerQuestion.includes('recent') || lowerQuestion.includes('latest')) {
      return 'Your most recent notes are: "Meeting Notes - Q1 Planning" (2 hours ago), "Project Ideas" (1 day ago), and "Research Notes" (2 days ago).';
    } else if (lowerQuestion.includes('summarize') || lowerQuestion.includes('summary')) {
      return 'I can help you summarize your notes! You can use the Summarize feature to get AI-powered summaries of any note. Would you like me to summarize a specific note?';
    } else if (lowerQuestion.includes('search') || lowerQuestion.includes('find')) {
      return 'You can search through all your notes using the Search feature. Just enter keywords and I\'ll help you find relevant notes instantly.';
    } else if (lowerQuestion.includes('connection') || lowerQuestion.includes('related')) {
      return 'Check out the Knowledge Map to see how your notes are connected! It shows visual relationships between different topics and ideas.';
    } else {
      return 'I\'m here to help you with your notes! You can ask me about your note count, recent notes, search for specific topics, or get summaries. What would you like to know?';
    }
  };

  const suggestedQuestions = [
    'How many notes do I have?',
    'Show me my recent notes',
    'How can I search my notes?',
    'What are my most connected topics?',
  ];

  return (
    <div className="flex h-full flex-col p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">AI Chatbot</h1>
        <p className="text-gray-300">
          Ask questions about your notes and get instant AI-powered answers
        </p>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {/* Messages */}
        <CardContent className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
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

              {/* Message */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/10 text-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="mt-1 text-xs opacity-60">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Suggested Questions */}
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

        {/* Input Area */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about your notes..."
              className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-gray-400"
            />
            <Button
              variant="default"
              size="default"    
              onClick={handleSend}
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