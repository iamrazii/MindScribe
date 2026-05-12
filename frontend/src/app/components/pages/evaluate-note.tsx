import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { FileCheck, Loader2, Info, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { api } from "../../lib/api";

export function EvaluateNote() {
  const location = useLocation();
  const navigate = useNavigate();
  const note = location.state?.note;

  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (note) {
      setNoteContent(note.content);
      setNoteTitle(note.title || "Untitled");
      handleEvaluate(note.id);
    }
  }, [note]);

 const handleEvaluate = async (noteId?: string) => {
  if (!noteId) {
    toast.error("Please save the note first or select an existing note to evaluate");
    return;
  }

  setIsEvaluating(true);

  try {
    const response = await api.notes.evaluate(noteId);

    const evaluation =
      typeof response === "string"
        ? response
        : response.evaluation || "";

    setEvaluation(evaluation);

    toast.success("Evaluation complete!");
  } catch (error) {
    toast.error("Failed to generate evaluation");
  } finally {
    setIsEvaluating(false);
  }
};

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Evaluate Note</h1>
          <p className="text-gray-300">Get AI-powered analysis and improvement suggestions</p>
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
              <CardTitle className="text-white">Note Content</CardTitle>
            </CardHeader>
            <CardContent className="">
              <Textarea
                placeholder="Content from your saved note..."
                value={noteContent}
                readOnly
                className="min-h-[500px] border-white/20 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>{noteContent.length} characters</span>
                <span>{noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0} words</span>
              </div>
              <Button
                variant="default"
                onClick={() => handleEvaluate(note?.id)}
                disabled={isEvaluating || !note}
                className="mt-4 w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-900/20"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 size-4" />
                    {evaluation ? 'Re-evaluate Note' : 'Evaluate Note'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {evaluation ? (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="">
                <CardTitle className="text-white">Evaluation Results</CardTitle>
              </CardHeader>
              <CardContent className="">
                <div className="prose prose-invert max-w-none whitespace-pre-wrap rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4 text-gray-200 shadow-inner">
                  {evaluation}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">
                  <FileCheck className="mx-auto mb-4 size-16 text-gray-600" />
                  <h3 className="mb-2 text-lg text-white">No Evaluation Yet</h3>
                  <p className="text-gray-400">Select a note and click evaluate</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Card className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="size-5 flex-shrink-0 text-cyan-400" />
            <div className="text-sm text-gray-300">
              <strong className="text-cyan-400">How it works:</strong> Our AI analyzes your note for clarity, structure, and completeness, then provides actionable suggestions.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}