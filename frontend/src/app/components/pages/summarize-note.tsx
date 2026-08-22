import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Sparkles, Loader2, FileText, Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { api } from "../../lib/api";

export function SummarizeNote() {
  const location = useLocation();
  const navigate = useNavigate();
  const note = location.state?.note;

  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (note) {
      setNoteContent(note.content);
      setNoteTitle(note.title || "Untitled");
      handleSummarize(note.title || "this note");
    }
  }, [note]);

  const handleSummarize = async (topic: string) => {
    if (!topic.trim() && !noteTitle.trim()) {
      toast.error("Please provide a topic or select a note to summarize");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.notes.summarize(topic || noteTitle);
      setSummary(typeof response === 'string' ? response : (response.summary || JSON.stringify(response)));
      toast.success("Summary generated successfully!");
    } catch (error) {
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Summarize Note</h1>
          <p className="text-gray-300">Get AI-powered summaries of your notes</p>
          {noteTitle && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">{noteTitle}</Badge>
            </div>
          )}
        </div>
        {note && (
          <Button variant="outline" onClick={() => navigate('/view')} className="border-white/20 bg-white/5 text-gray-300">
            <ArrowLeft className="mr-2 size-4" />
            Back to Notes
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="size-5 text-cyan-400" />
                Original Note
              </CardTitle>
            </CardHeader>
            <CardContent className="">
              <Textarea
                placeholder="Note content..."
                value={noteContent}
                readOnly
                className="min-h-[400px] border-white/20 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>{noteContent.length} characters</span>
                <span>{noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="">
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
                      <>
                        <CheckCircle2 className="mr-2 size-4 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 size-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="">
              {summary ? (
                <div className="min-h-[400px] whitespace-pre-wrap rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4 text-gray-200 shadow-inner prose prose-invert">
                  {summary}
                </div>
              ) : (
                <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/10">
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-3 size-12 text-gray-600" />
                    <p className="text-gray-400">Your summary will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button
          variant="default"
          onClick={() => handleSummarize(noteTitle || "my recent topics")}
          disabled={isGenerating || (!noteContent.trim() && !noteTitle.trim())}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Generating Summary...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-5" />
              {summary ? 'Regenerate Summary' : 'Generate Summary'}
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:border-cyan-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="mb-2 font-semibold text-cyan-400">⚡ Fast Processing</div>
            <div className="text-sm text-gray-300">Get summaries in seconds with AI</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:border-cyan-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="mb-2 font-semibold text-cyan-400">🎯 Key Points</div>
            <div className="text-sm text-gray-300">Extracts the most important information</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm hover:border-cyan-500/30 transition-colors">
          <CardContent className="p-4">
            <div className="mb-2 font-semibold text-cyan-400">📋 Easy Copy</div>
            <div className="text-sm text-gray-300">Copy summaries with one click</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}