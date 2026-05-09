import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Save, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function CreateNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }
    setIsSaving(true);
    try {
      await api.notes.create({ title, content });
      toast.success("Note saved and clustered successfully!");
      setTitle("");
      setContent("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!content.trim()) {
      toast.error("Write something first so AI can suggest improvements");
      return;
    }
    setIsAiSuggesting(true);
    try {
      const res = await api.notes.ask(
        `Give me a brief, specific suggestion to improve this note content:\n\n${content}`
      );
      setContent((c) => c + "\n\n💡 AI Suggestion: " + res.answer);
      toast.success("AI suggestion added!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI suggestion failed");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Create a Note</h1>
        <p className="text-gray-300">Write your thoughts with AI assistance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-200">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-white/20 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-gray-200">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Start writing your note..."
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    className="min-h-[400px] border-white/20 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-900/20"
                  >
                    {isSaving ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</>
                    ) : (
                      <><Save className="mr-2 size-4" />Save Note</>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleAiSuggest}
                    disabled={isAiSuggesting || !content.trim()}
                    className="border-white/20 bg-white/5 text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50"
                  >
                    {isAiSuggesting ? (
                      <><Loader2 className="mr-2 size-4 animate-spin" />Thinking...</>
                    ) : (
                      <><Sparkles className="mr-2 size-4" />AI Suggest</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="relative z-10">
              <CardTitle className="text-white font-semibold">Writing Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300 relative z-10">
              {["Use clear, descriptive titles", "Break content into paragraphs", "Use AI suggestions for improvements", "Save regularly to avoid losing work"].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <p>{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="relative z-10">
              <CardTitle className="text-white font-semibold">Note Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm relative z-10">
              <div className="flex justify-between text-gray-300">
                <span>Characters:</span>
                <span className="text-cyan-400 font-mono font-bold">{content.length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Words:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {content.trim() ? content.trim().split(/\s+/).length : 0}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Reading time:</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {Math.max(1, Math.ceil((content.trim().split(/\s+/).length || 0) / 200))} min
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}