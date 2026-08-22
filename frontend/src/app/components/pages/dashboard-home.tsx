import { useState, useEffect } from "react";
import { Link } from "react-router";
import { PlusCircle, Eye, Sparkles, Search, TrendingUp, FileText, Clock, Network, MessageSquare, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { api } from "../../lib/api";

export function DashboardHome() {
  const [allNotes, setAllNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.notes.list();
        setAllNotes(data || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchNotes();
  }, []);

  const actions = [
    { title: "Create a Note", description: "Start a new note with AI assistance", icon: PlusCircle, color: "from-cyan-500 to-teal-500", href: "/create" },
    { title: "View Notes", description: "Browse and manage your notes", icon: Eye, color: "from-teal-500 to-emerald-500", href: "/view" },
    { title: "Search Notes", description: "Find notes quickly with search", icon: Search, color: "from-cyan-500 to-blue-500", href: "/search" },
    { title: "Knowledge Map", description: "Visualize note connections", icon: Network, color: "from-purple-500 to-pink-500", href: "/knowledge-map" },
    { title: "Smart Search", description: "Ask questions about your notes", icon: MessageSquare, color: "from-blue-500 to-cyan-500", href: "/chatbot" },
  ];

  const recentNotes = [...allNotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);
  const totalWords = allNotes.reduce((sum, note) => sum + (note.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl text-white">Welcome back!</h1>
        <p className="text-gray-300">What would you like to do today?</p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl text-white">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-2xl hover:shadow-teal-500/20 cursor-pointer h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-10`} />
                  <CardHeader className="">
                    <div className={`mb-3 flex size-12 items-center justify-center rounded-lg bg-gradient-to-br ${action.color}`}>
                      <Icon className="size-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{action.title}</CardTitle>
                    <CardDescription className="text-gray-300">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="">
                    <div className="flex items-center text-sm text-cyan-400 group-hover:text-cyan-300">
                      Get started
                      <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl text-white">Your Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">Total Notes</CardTitle>
              <FileText className="size-4 text-cyan-400" />
            </CardHeader>
            <CardContent className="">
              <div className="text-3xl text-white">{allNotes.length}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">Average Words</CardTitle>
              <Clock className="size-4 text-yellow-400" />
            </CardHeader>
            <CardContent className="">
              <div className="text-3xl text-white">{allNotes.length > 0 ? Math.round(totalWords / allNotes.length) : 0}</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-300">Words Written</CardTitle>
              <Sparkles className="size-4 text-teal-400" />
            </CardHeader>
            <CardContent className="">
              <div className="text-3xl text-white">{totalWords.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl text-white">Recent Notes</h2>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-white/10">
                {recentNotes.map((note) => (
                  <Link key={note.id} to="/view" className="flex items-center justify-between p-4 transition-colors hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600/20">
                        <FileText className="size-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-white">{note.title || "Untitled"}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(note.created_at).toLocaleDateString()} • {note.content?.split(/\s+/).length || 0} words
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">→</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}