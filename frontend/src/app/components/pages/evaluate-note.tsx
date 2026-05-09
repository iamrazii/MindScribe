import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FileCheck, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
}

export function EvaluateNote() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [evaluation, setEvaluation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNotes, setIsFetchingNotes] = useState(true);

  useEffect(() => {
    api.notes
      .list()
      .then((data) => setNotes(data ?? []))
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setIsFetchingNotes(false));
  }, []);

  const handleEvaluate = async () => {
    if (!selectedNote) return;
    setIsLoading(true);
    setEvaluation("");
    try {
      const res = await api.notes.evaluate(selectedNote.id);
      setEvaluation(res.evaluation);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Evaluate Note</h1>
        <p className="text-gray-300">
          Get expert AI feedback on clarity, completeness, and quality
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Note Picker */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="relative z-10">
            <CardTitle className="text-white">Select a Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            {isFetchingNotes ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-6 animate-spin text-cyan-400" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-gray-400 text-sm">No notes found. Create a note first.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {notes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => { setSelectedNote(note); setEvaluation(""); }}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedNote?.id === note.id
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-medium text-sm truncate">
                      {note.title ?? "Untitled"}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {note.content}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleEvaluate}
              disabled={!selectedNote || isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />Evaluating...</>
              ) : (
                <><FileCheck className="mr-2 size-4" />Evaluate Note</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Evaluation Output */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="relative z-10">
            <CardTitle className="text-white">
              {selectedNote ? `Evaluation: ${selectedNote.title ?? "Untitled"}` : "Evaluation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            {evaluation ? (
              <div className="max-h-[420px] overflow-y-auto rounded-lg bg-white/5 p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {evaluation}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileCheck className="mb-3 size-10 opacity-40" />
                <p className="text-sm">
                  {selectedNote
                    ? "Click 'Evaluate Note' to get AI feedback"
                    : "Select a note from the left to begin"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}