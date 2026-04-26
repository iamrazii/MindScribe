import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertCircle,
  Trash2,
  Search,
  FileText,
  Clock,
  X,
} from "lucide-react";
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

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  words: number;
}

export function DeleteNote() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Meeting Notes - Q1 Planning",
      content: "Discussed project roadmap and key milestones for the upcoming quarter...",
      date: "2 hours ago",
      category: "Work",
      words: 450,
    },
    {
      id: 2,
      title: "Project Ideas",
      content: "Brainstorming session for new features and improvements to the platform...",
      date: "1 day ago",
      category: "Ideas",
      words: 320,
    },
    {
      id: 3,
      title: "Research Notes - AI Technology",
      content: "Comprehensive notes on the latest advancements in artificial intelligence...",
      date: "2 days ago",
      category: "Research",
      words: 890,
    },
    {
      id: 4,
      title: "Personal Goals 2026",
      content: "Setting clear and achievable goals for personal and professional growth...",
      date: "3 days ago",
      category: "Personal",
      words: 275,
    },
    {
      id: 5,
      title: "Team Retrospective",
      content: "Reflecting on the past sprint and identifying areas for improvement...",
      date: "1 week ago",
      category: "Work",
      words: 520,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<number[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectNote = (id: number) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === filteredNotes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filteredNotes.map((note) => note.id));
    }
  };

  const handleDeleteSingle = (id: number) => {
    setNoteToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSingle = () => {
    if (noteToDelete) {
      setNotes((prev) => prev.filter((note) => note.id !== noteToDelete));
      toast.success("Note deleted successfully");
      setShowDeleteDialog(false);
      setNoteToDelete(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotes.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = () => {
    setNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)));
    toast.success(`${selectedNotes.length} notes deleted successfully`);
    setSelectedNotes([]);
    setShowBulkDeleteDialog(false);
  };

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Delete Notes</h1>
        <p className="text-gray-300">Manage and remove unwanted notes</p>
      </div>

      <Card className="mb-6 border-red-500/20 bg-red-500/5 backdrop-blur-sm">
        <CardContent className="flex items-start gap-3 p-4 relative z-10">
          <AlertCircle className="size-5 flex-shrink-0 text-red-400" />
          <div className="text-sm">
            <p className="mb-1 text-red-200">
              <strong>Warning:</strong> Deleted notes cannot be recovered.
            </p>
            <p className="text-red-300/80">Please review carefully before deleting any notes.</p>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Input
            id="search-notes"
            placeholder="Search notes to delete..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-white/20 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-500"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10"
          >
            {selectedNotes.length === filteredNotes.length ? "Deselect All" : "Select All"}
          </Button>
          {selectedNotes.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="bg-red-600 text-white"
            >
              <Trash2 className="mr-2 size-4" />
              Delete Selected ({selectedNotes.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
            <CardHeader className="relative z-10">
              <div className="mb-2 flex items-start justify-between">
                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">{note.category}</Badge>
                <input
                  type="checkbox"
                  checked={selectedNotes.includes(note.id)}
                  onChange={() => handleSelectNote(note.id)}
                  className="size-4 cursor-pointer accent-cyan-500"
                />
              </div>
              <CardTitle className="line-clamp-2 text-white">{note.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="mb-4 line-clamp-3 text-sm text-gray-300">{note.content}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteSingle(note.id)}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="mr-2 size-4" />
                Delete Note
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDeleteSingle}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Multiple Notes</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Permanently delete {selectedNotes.length} notes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmBulkDelete}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}