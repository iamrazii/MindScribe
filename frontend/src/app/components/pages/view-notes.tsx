"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FileText, Clock, Eye, Trash2, Share2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import { api } from "../../lib/api";

interface Note {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  cluster_id: string;
}

export function ViewNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Share dialog
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [shareUsername, setShareUsername] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  // View dialog
  const [viewNote, setViewNote] = useState<Note | null>(null);

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

  const handleDelete = async (note: Note) => {
    if (!confirm(`Delete "${note.title ?? "Untitled"}"?`)) return;
    try {
      await api.notes.delete(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      toast.success("Note deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleShareSubmit = async () => {
    if (!activeNote || !shareUsername.trim()) return;
    setIsSharing(true);
    try {
      await api.messages.send({
        receiver_username: shareUsername.trim(),
        content: shareMsg.trim() || `Sharing note: "${activeNote.title ?? "Untitled"}"`,
        note_id: activeNote.id,
      });
      toast.success(`Note shared with @${shareUsername}`);
      setIsShareOpen(false);
      setShareUsername("");
      setShareMsg("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Share failed");
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

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
    <div className="p-6 lg:p-8 font-sans bg-transparent">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">View Notes</h1>
        <p className="text-gray-300">Browse and manage all your notes</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative sm:max-w-md">
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-white/20 bg-white/5 pl-10 text-white placeholder:text-gray-500"
          />
          <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Notes Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <CardHeader className="relative z-10">
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30 text-xs">
                    cluster
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewNote(note)}
                      className="size-8 p-0 text-gray-400 hover:text-cyan-400"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setActiveNote(note); setIsShareOpen(true); }}
                      className="size-8 p-0 text-gray-400 hover:text-blue-400"
                    >
                      <Share2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(note)}
                      className="size-8 p-0 text-gray-400 hover:text-rose-400"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-white">
                  {note.title ?? "Untitled"}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="mb-4 line-clamp-3 text-sm text-gray-300">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  <span>{wordCount(note.content)} words</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
            <FileText className="mb-4 size-12 text-gray-500" />
            <h3 className="mb-2 text-lg text-white font-semibold">
              {notes.length === 0 ? "No notes yet" : "No notes match your search"}
            </h3>
            <p className="text-gray-400">
              {notes.length === 0 ? "Create your first note to get started" : "Try different keywords"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="text-2xl font-bold text-white">{filtered.length}</div>
            <div className="text-sm text-gray-400">Notes Displayed</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="text-2xl font-bold text-white">
              {filtered.reduce((s, n) => s + wordCount(n.content), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Words</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="text-2xl font-bold text-white">{notes.length}</div>
            <div className="text-sm text-gray-400">Total Notes</div>
          </CardContent>
        </Card>
      </div>

      {/* View Note Modal */}
      <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
        <DialogContent className="border-white/10 bg-[#0f172a] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewNote?.title ?? "Untitled"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {viewNote ? formatDate(viewNote.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto rounded-lg bg-white/5 p-4 text-gray-200 text-sm whitespace-pre-wrap">
            {viewNote?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal — receiver identified by username, not ID */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="border-white/10 bg-[#0f172a] text-white">
          <DialogHeader>
            <DialogTitle>Share "{activeNote?.title ?? "Untitled"}"</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the username of the person you want to share with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="@username"
              value={shareUsername}
              onChange={(e) => setShareUsername(e.target.value)}
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
              className="border-white/20 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleShareSubmit}
              disabled={isSharing || !shareUsername.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
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