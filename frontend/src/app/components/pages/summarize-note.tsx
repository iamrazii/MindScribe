import React, { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Sparkles,
  Loader2,
  FileText,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export function SummarizeNote() {
  const [noteContent, setNoteContent] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSummarize = () => {
    if (!noteContent.trim()) {
      toast.error("Please enter note content to summarize");
      return;
    }

    setIsGenerating(true);
    // Simulate AI summarization
    setTimeout(() => {
      const summaryText = `📝 Summary:\n\nThis note discusses key concepts and ideas presented in the original content. The main points cover important aspects that provide valuable insights and actionable information.\n\n🔑 Key Points:\n• Primary topic with detailed explanation\n• Secondary considerations and their implications\n• Actionable recommendations for implementation\n• Future considerations and next steps\n\n💡 Conclusion:\nThe content provides a comprehensive overview that can be applied to improve understanding and decision-making processes.`;

      setSummary(summaryText);
      setIsGenerating(false);
      toast.success("Summary generated successfully!");
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Summarize Note
        </h1>
        <p className="text-gray-300">
          Get AI-powered summaries of your notes
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="size-5 text-cyan-400" />
                Original Note
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <Textarea
                placeholder="Paste or type your note content here..."
                value={noteContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteContent(e.target.value)}
                className="min-h-[400px] border-white/20 bg-white/5 text-white placeholder:text-gray-500"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>{noteContent.length} characters</span>
                <span>
                  {noteContent.trim()
                    ? noteContent.trim().split(/\s+/).length
                    : 0}{" "}
                  words
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="size-5 text-cyan-400" />
                  AI Summary
                </CardTitle>
                {summary && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="border-white/20 bg-white/5 text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                  >
                    {copied ? (
                      <React.Fragment>
                        <CheckCircle2 className="mr-2 size-4 text-emerald-400" />
                        Copied
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <Copy className="mr-2 size-4" />
                        Copy
                      </React.Fragment>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {summary ? (
                <div className="min-h-[400px] whitespace-pre-wrap rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4 text-gray-200 shadow-inner">
                  {summary}
                </div>
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10">
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-3 size-12 text-gray-600" />
                    <p className="text-gray-400">
                      Your summary will appear here
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <Button
          variant="default"
          onClick={handleSummarize}
          disabled={isGenerating || !noteContent.trim()}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-900/20"
          size="lg"
        >
          {isGenerating ? (
            <React.Fragment>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Generating Summary...
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Sparkles className="mr-2 size-5" />
              Generate Summary
            </React.Fragment>
          )}
        </Button>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="mb-2 font-semibold text-cyan-400">
              ⚡ Fast Processing
            </div>
            <div className="text-sm text-gray-300">
              Get summaries in seconds with AI
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="mb-2 font-semibold text-cyan-400">
              🎯 Key Points
            </div>
            <div className="text-sm text-gray-300">
              Extracts the most important information
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="mb-2 font-semibold text-cyan-400">
              📋 Easy Copy
            </div>
            <div className="text-sm text-gray-300">
              Copy summaries with one click
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}