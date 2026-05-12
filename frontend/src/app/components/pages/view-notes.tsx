import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FileText, Clock, Eye, Edit, Trash2, Sparkles, FileCheck, Radar, Link2, TrendingUp, AlertTriangle, Share2, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from 'sonner';
import { api } from '../../lib/api';

export function ViewNotes() {
  const navigate = useNavigate();
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [relatedNotes, setRelatedNotes] = useState<any[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<any>(null);
  const [allNotes, setAllNotes] = useState<any[]>([]);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const loadNotes = async () => {
    try {
      const data = await api.notes.list();
      setAllNotes(data || []);
    } catch (error) {
      toast.error('Failed to load notes');
    }
  };

  useEffect(() => {
    loadNotes();
    const handleNotesUpdate = () => loadNotes();
    window.addEventListener('notesUpdated', handleNotesUpdate);
    return () => window.removeEventListener('notesUpdated', handleNotesUpdate);
  }, []);

  const handleView = (note: any) => navigate('/view-note', { state: { note } });
  const handleEdit = (note: any) => navigate('/edit-note', { state: { note } });
  const handleSummarize = (note: any) => navigate('/summarize', { state: { note } });
  const handleEvaluate = (note: any) => navigate('/evaluate', { state: { note } });

  const handleDeleteConfirm = async () => {
    if (noteToDelete) {
      try {
        await api.notes.delete(noteToDelete.id);
        setAllNotes(allNotes.filter(n => n.id !== noteToDelete.id));
        toast.success(`Deleted successfully`);
        if (selectedNote?.id === noteToDelete.id) {
          setSelectedNote(null);
          setRelatedNotes([]);
        }
      } catch (error) {
        toast.error('Failed to delete note');
      } finally {
        setNoteToDelete(null);
      }
    }
  };

  const loadRelatedNotes = async (noteId: string) => {
    try {
      const data = await api.notes.radar(noteId);
      setRelatedNotes(data || []);
    } catch (error) {
      setRelatedNotes([]);
    }
  };

  const handleNoteClick = (note: any) => {
    setSelectedNote(note);
    loadRelatedNotes(note.id);
  };

  const handleShareClick = (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNote(note);
    setIsShareOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!shareEmail.trim() || !selectedNote) return;
    setIsSharing(true);
    try {
      await api.messages.send({
        receiver_email: shareEmail.trim(),
        content: shareMsg.trim() || `I shared a note with you: ${selectedNote.title || "Untitled"}`,
        note_id: selectedNote.id
      });
      toast.success("Note shared successfully!");
      setIsShareOpen(false);
      setShareEmail("");
      setShareMsg("");
    } catch (err: any) {
      toast.error(err.message || "Failed to share note");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex h-full gap-6 p-6 lg:p-8">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-white">View Notes</h1>
          <p className="text-gray-300">Browse and manage all your notes</p>
        </div>

        {allNotes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {allNotes.map((note) => (
              <Card
                key={note.id}
                onClick={() => handleNoteClick(note)}
                className={`group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-white/10 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer ${
                  selectedNote?.id === note.id ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <CardHeader className="">
                  <div className="mb-2 flex items-start justify-between">
                    <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-600/30">
                      Note
                    </Badge>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400" onClick={(e) => { e.stopPropagation(); handleView(note); }}>
                        <Eye className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400" onClick={(e) => handleShareClick(note, e)}>
                        <Share2 className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400" onClick={(e) => { e.stopPropagation(); handleSummarize(note); }}>
                        <Sparkles className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-green-500/10 hover:text-green-400" onClick={(e) => { e.stopPropagation(); handleEvaluate(note); }}>
                        <FileCheck className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400" onClick={(e) => { e.stopPropagation(); handleEdit(note); }}>
                        <Edit className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="size-8 p-0 text-gray-400 hover:bg-rose-500/10 hover:text-rose-400" onClick={(e) => { e.stopPropagation(); setNoteToDelete(note); }}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 text-white">{note.title || "Untitled"}</CardTitle>
                </CardHeader>
                <CardContent className="">
                  <p className="mb-4 line-clamp-3 text-sm text-gray-300">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <span>{note.content?.split(/\s+/).length || 0} words</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 size-12 text-gray-500" />
              <h3 className="mb-2 text-lg text-white">No notes found</h3>
              <p className="text-gray-400">Create a note to see it here</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{allNotes.length}</div>
              <div className="text-sm text-gray-400">Notes Displayed</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">
                {allNotes.reduce((sum, note) => sum + (note.content?.split(/\s+/).length || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Words</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">
                {allNotes.length > 0
                  ? Math.round(allNotes.reduce((sum, note) => sum + (note.content?.split(/\s+/).length || 0), 0) / allNotes.length)
                  : 0}
              </div>
              <div className="text-sm text-gray-400">Avg Words/Note</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-80 shrink-0 hidden lg:block">
        <Card className="sticky top-6 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 backdrop-blur-sm">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2 text-white">
              <Radar className="size-5 text-cyan-400 animate-pulse" />
              Context Radar
            </CardTitle>
            <p className="text-xs text-gray-400">
              {selectedNote ? 'Related notes found via Vector Similarity' : 'Select a note to see related content'}
            </p>
          </CardHeader>
          <CardContent className="">
            {selectedNote ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400 font-medium">Current Selection</span>
                  </div>
                  <h4 className="text-sm text-white font-medium mb-1">{selectedNote.title || "Untitled"}</h4>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs text-gray-400 font-medium flex items-center gap-2">
                    <Link2 className="size-3" />
                    Related Notes ({relatedNotes.length})
                  </h4>
                  {relatedNotes.length > 0 ? (
                    relatedNotes.map((relatedNote) => (
                      <div
                        key={relatedNote.note_id}
                        onClick={() => {
                          const originalNote = allNotes.find(n => n.id === relatedNote.note_id);
                          if(originalNote) handleNoteClick(originalNote);
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm text-white font-medium line-clamp-1 flex-1">
                            {relatedNote.title || "Untitled"}
                          </h5>
                          <Badge variant="outline" className="bg-purple-600/20 text-purple-400 border-purple-500/30 text-xs shrink-0">
                            Dist: {relatedNote.distance.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{relatedNote.excerpt}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No related notes found
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Radar className="size-12 text-gray-500 mb-3" />
                <p className="text-sm text-gray-400">
                  Click on any note to see related content and connections
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-slate-900">
          <AlertDialogHeader className="">
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="size-5 text-rose-400" />
              Delete Note
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete "{noteToDelete?.title || "Untitled"}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 text-white hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="border-white/10 bg-slate-900">
          <DialogHeader className="">
            <DialogTitle className="text-white">Share Note</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the email address of the person you want to share with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="user@example.com"
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
            />
            <Input
              placeholder="Optional message..."
              value={shareMsg}
              onChange={(e) => setShareMsg(e.target.value)}
              className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsShareOpen(false)}
              className="border-white/20 bg-transparent text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleShareSubmit}
              disabled={isSharing || !shareEmail.trim()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isSharing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Share Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}