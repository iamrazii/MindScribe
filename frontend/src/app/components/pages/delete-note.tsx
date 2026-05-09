import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertCircle, Trash2, Search, FileText, Clock, X, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
}

export function DeleteNote() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    api.notes
      .list()
      .then((data) => setNotes(data ?? []))
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = notes.filter(
    (n) =>
      (n.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await api.notes.delete(noteToDelete.id);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      toast.success(`"${noteToDelete.title ?? "Untitled"}" deleted`);
      setNoteToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const wordCount = (content: string) =>
    content.trim() ? content.trim().split(/\s+/).length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="size-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Delete Notes</h1>
        <p className="text-gray-300">Permanently remove notes you no longer need</p>
      </div>

      {/* Warning banner */}
      <Card className="mb-6 border-rose-500/30 bg-rose-500/10 backdrop-blur-sm">
        <CardContent className="flex items-center gap-3 p-4 relative z-10">
          <AlertCircle className="size-5 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-300">
            Deleted notes cannot be recovered. The note's cluster will be cleaned up automatically.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-6 relative sm:max-w-md">
        <Input
          placeholder="Filter notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-white/20 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-500"
        />
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className="border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <CardContent className="flex items-center justify-between p-4 relative z-10">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
                    <FileText className="size-5 text-rose-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">
                      {note.title ?? "Untitled"}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(note.created_at)}
                      </span>
                      <span>{wordCount(note.content)} words</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNoteToDelete(note)}
                  className="shrink-0 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
            <FileText className="mb-4 size-12 text-gray-500" />
            <h3 className="mb-2 text-lg text-white font-semibold">
              {notes.length === 0 ? "No notes found" : "No notes match your filter"}
            </h3>
            <p className="text-gray-400">
              {notes.length === 0 ? "Create a note first" : "Try different keywords"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-[#0f172a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{noteToDelete?.title ?? "Untitled"}"?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action is permanent and cannot be undone. The note will be removed along with all
              its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-gray-300 bg-transparent hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}