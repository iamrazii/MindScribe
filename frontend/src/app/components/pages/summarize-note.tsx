import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Sparkles, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { Label } from "../ui/label";

export function SummarizeNote() {
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic to summarize");
      return;
    }
    setIsGenerating(true);
    setSummary("");
    try {
      const res = await api.notes.summarize(topic);
      setSummary(res.summary);
      toast.success("Summary generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Summarization failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Summarize Notes</h1>
        <p className="text-gray-300">
          Enter a topic and AI will synthesize your related notes into a summary
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="relative z-10">
            <CardTitle className="text-white">Topic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="space-y-2">
              <Label className="text-gray-300">What topic should I summarize?</Label>
              <Input
                placeholder="e.g. machine learning, project planning..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSummarize()}
                className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              onClick={handleSummarize}
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 text-white hover:from-yellow-700 hover:to-amber-700"
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Synthesizing notes...</>
              ) : (
                <><Sparkles className="mr-2 size-4" />Generate Summary</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between relative z-10">
            <CardTitle className="text-white">Summary</CardTitle>
            {summary && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="text-gray-400 hover:text-cyan-400"
              >
                {copied ? <CheckCircle2 className="size-4 text-green-400" /> : <Copy className="size-4" />}
              </Button>
            )}
          </CardHeader>
          <CardContent className="relative z-10">
            {summary ? (
              <div className="max-h-96 overflow-y-auto rounded-lg bg-white/5 p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {summary}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Sparkles className="mb-3 size-10 opacity-40" />
                <p className="text-sm">Your summary will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}