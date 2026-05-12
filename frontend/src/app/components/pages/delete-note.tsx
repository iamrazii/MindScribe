import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertCircle, Trash2, Search, FileText, Clock, X } from "lucide-react";
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

export function DeleteNote() {
  const [notes, setNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const fetchNotes = async () => {
    try {
      const data = await api.notes.list();
      setNotes(data || []);
    } catch (error) {
      toast.error('Failed to load notes');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const filteredNotes = notes.filter((note) =>
    (note.title && note.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectNote = (id: string) => {
    setSelectedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotes.length === filteredNotes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filteredNotes.map((note) => note.id));
    }
  };

  const handleDeleteSingle = (id: string) => {
    setNoteToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSingle = async () => {
    if (noteToDelete) {
      try {
        await api.notes.delete(noteToDelete);
        setNotes((prev) => prev.filter((note) => note.id !== noteToDelete));
        toast.success("Note deleted successfully");
        window.dispatchEvent(new Event('notesUpdated'));
      } catch (error) {
        toast.error('Failed to delete note');
      } finally {
        setShowDeleteDialog(false);
        setNoteToDelete(null);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotes.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      for (const id of selectedNotes) {
        await api.notes.delete(id);
      }
      setNotes((prev) => prev.filter((note) => !selectedNotes.includes(note.id)));
      toast.success(`${selectedNotes.length} notes deleted successfully`);
      setSelectedNotes([]);
      window.dispatchEvent(new Event('notesUpdated'));
    } catch (error) {
      toast.error('Error occurred during bulk deletion');
    } finally {
      setShowBulkDeleteDialog(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Delete Notes</h1>
        <p className="text-gray-300">Manage and remove unwanted notes</p>
      </div>

      <Card className="mb-6 border-red-500/20 bg-red-500/5 backdrop-blur-sm">
        <CardContent className="flex items-start gap-3 p-4">
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
            placeholder="Search notes to delete..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-white/20 bg-white/5 pl-10 pr-10 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll} className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white">
            {selectedNotes.length === filteredNotes.length && filteredNotes.length > 0 ? "Deselect All" : "Select All"}
          </Button>
          {selectedNotes.length > 0 && (
            <Button variant="default" size="sm" onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20">
              <Trash2 className="mr-2 size-4" />
              Delete Selected ({selectedNotes.length})
            </Button>
          )}
        </div>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 ${
                selectedNotes.includes(note.id) ? "ring-2 ring-cyan-500 bg-cyan-500/5" : ""
              }`}
            >
              <CardHeader className="">
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">Note</Badge>
                  <input
                    type="checkbox"
                    checked={selectedNotes.includes(note.id)}
                    onChange={() => handleSelectNote(note.id)}
                    className="size-4 cursor-pointer rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                  />
                </div>
                <CardTitle className="line-clamp-2 text-white">{note.title || "Untitled"}</CardTitle>
              </CardHeader>
              <CardContent className="">
                <p className="mb-4 line-clamp-3 text-sm text-gray-300">{note.content}</p>
                <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                  <span>{note.content?.split(/\s+/).length || 0} words</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSingle(note.id)}
                  className="w-full border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Note
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 size-12 text-gray-500" />
            <h3 className="mb-2 text-lg text-white">
              {searchQuery ? "No notes found" : "No notes to delete"}
            </h3>
            <p className="text-gray-400">
              {searchQuery ? "Try adjusting your search criteria" : "All your notes have been deleted or you have no notes yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {notes.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{notes.length}</div>
              <div className="text-sm text-gray-400">Total Notes</div>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-cyan-400">{selectedNotes.length}</div>
              <div className="text-sm text-cyan-300/60">Selected for Deletion</div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-slate-900 shadow-2xl shadow-black">
          <AlertDialogHeader className="">
            <AlertDialogTitle className="text-white">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSingle} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-slate-900 shadow-2xl shadow-black">
          <AlertDialogHeader className="">
            <AlertDialogTitle className="text-white">Delete Multiple Notes</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete {selectedNotes.length} note{selectedNotes.length !== 1 ? "s" : ""}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}