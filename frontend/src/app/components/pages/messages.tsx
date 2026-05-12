import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Mail, Send, FileText, Loader2, Clock, Inbox, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function Messages() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningNote, setIsOpeningNote] = useState<string | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const data = activeTab === "inbox" ? await api.messages.inbox() : await api.messages.sent();
      setMessages(data || []);
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  const handleOpenNote = async (noteId: string) => {
    setIsOpeningNote(noteId);
    try {
      const note = await api.notes.get(noteId);
      navigate('/view-note', { state: { note, readOnly: activeTab === "inbox" } });
    } catch (error) {
      toast.error("Failed to open note. It may have been deleted by the owner.");
      // Refresh messages to update the deleted state
      fetchMessages();
    } finally {
      setIsOpeningNote(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Messages</h1>
          <p className="text-gray-300">View shared notes and messages</p>
        </div>
        <div className="flex gap-2 rounded-lg bg-black/20 p-1">
          <Button
            variant={activeTab === "inbox" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("inbox")}
            className={activeTab === "inbox" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"}
          >
            <Inbox className="mr-2 size-4" />
            Inbox
          </Button>
          <Button
            variant={activeTab === "sent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("sent")}
            className={activeTab === "sent" ? "bg-teal-600 text-white" : "text-gray-400 hover:text-white"}
          >
            <Send className="mr-2 size-4" />
            Sent
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-cyan-500" />
        </div>
      ) : messages.length > 0 ? (
        <div className="grid gap-4">
          {messages.map((msg) => (
            <Card key={msg.id} className="border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10">
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                      {activeTab === "inbox" ? "Received" : "Sent"}
                    </Badge>
                    <span className="text-sm font-medium text-gray-300">
                      {activeTab === "inbox" ? `From: ${msg.sender_email || msg.sender_username}` : `To: ${msg.receiver_email || msg.receiver_username}`}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="size-3" />
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  
                  </div>
                  <p className="text-gray-200">{msg.content}</p>
                </div>
                
                {msg.note_id && !msg.note_deleted && (
                  <Button
                    variant="outline"
                    onClick={() => handleOpenNote(msg.note_id)}
                    disabled={isOpeningNote === msg.note_id}
                    className="shrink-0 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    {isOpeningNote === msg.note_id ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 size-4" />
                    )}
                    Open Note
                  </Button>
                )}

                {msg.note_id && msg.note_deleted && (
                  <div className="shrink-0 flex items-center px-4 py-2 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm font-medium">
                    <AlertCircle className="mr-2 size-4 opacity-70" />
                    Owner has deleted this note
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="mb-4 size-12 text-gray-500" />
            <h3 className="mb-2 text-lg text-white">No messages found</h3>
            <p className="text-gray-400">
              {activeTab === "inbox" ? "Your inbox is empty." : "You haven't sent any notes yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}