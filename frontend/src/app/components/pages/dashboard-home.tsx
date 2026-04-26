import React from "react";
import { Link } from "react-router";
import {
  PlusCircle,
  Eye,
  Sparkles,
  FileCheck,
  Search,
  TrendingUp,
  FileText,
  Clock,
  Network,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function DashboardHome() {
  const actions = [
    {
      title: "Create a Note",
      description: "Start a new note with AI assistance",
      icon: PlusCircle,
      color: "from-cyan-500 to-teal-500",
      href: "/create",
    },
    {
      title: "View Notes",
      description: "Browse and manage your notes",
      icon: Eye,
      color: "from-teal-500 to-emerald-500",
      href: "/view",
    },
    {
      title: "Summarize Note",
      description: "Get AI-powered summaries",
      icon: Sparkles,
      color: "from-yellow-500 to-amber-500",
      href: "/summarize",
    },
    {
      title: "Evaluate Note",
      description: "Analyze and improve your notes",
      icon: FileCheck,
      color: "from-emerald-500 to-green-500",
      href: "/evaluate",
    },
    {
      title: "Search Notes",
      description: "Find notes quickly with search",
      icon: Search,
      color: "from-cyan-500 to-blue-500",
      href: "/search",
    },
    {
      title: "Knowledge Map",
      description: "Visualize note connections",
      icon: Network,
      color: "from-purple-500 to-pink-500",
      href: "/knowledge-map",
    },
    {
      title: "AI Chatbot",
      description: "Ask questions about your notes",
      icon: MessageSquare,
      color: "from-blue-500 to-cyan-500",
      href: "/chatbot",
    },
  ];

  const recentNotes = [
    {
      id: 1,
      title: "Meeting Notes - Q1 Planning",
      date: "2 hours ago",
      words: 450,
    },
    {
      id: 2,
      title: "Project Ideas",
      date: "1 day ago",
      words: 320,
    },
    {
      id: 3,
      title: "Research Notes",
      date: "2 days ago",
      words: 890,
    },
  ];

  return (
    <div className="p-6 lg:p-8 font-sans">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Welcome back!
        </h1>
        <p className="text-gray-300">
          What would you like to do today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-2xl hover:shadow-teal-500/20 cursor-pointer h-full">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-10`}
                  />
                  <CardHeader className="relative z-10">
                    <div
                      className={`mb-3 flex size-12 items-center justify-center rounded-lg bg-gradient-to-br ${action.color}`}
                    >
                      <Icon className="size-6 text-white" />
                    </div>
                    <CardTitle className="text-white">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-center text-sm text-cyan-400 group-hover:text-cyan-300">
                      Get started
                      <span className="ml-1 transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">
          Your Statistics
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-300">
                Total Notes
              </CardTitle>
              <FileText className="size-4 text-cyan-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">24</div>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <TrendingUp className="mr-1 size-3" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-300">
                This Week
              </CardTitle>
              <Clock className="size-4 text-yellow-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">12</div>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <TrendingUp className="mr-1 size-3" />
                +25% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm text-gray-300">
                Words Written
              </CardTitle>
              <Sparkles className="size-4 text-teal-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white">5.2k</div>
              <p className="mt-1 flex items-center text-xs text-green-400">
                <TrendingUp className="mr-1 size-3" />
                +8% from last week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Notes */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">
          Recent Notes
        </h2>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-0 relative z-10">
            <div className="divide-y divide-white/10">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  to="/view"
                  className="flex items-center justify-between p-4 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600/20">
                      <FileText className="size-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {note.title}
                      </div>
                      <div className="text-sm text-gray-400">
                        {note.date} • {note.words} words
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
  );
}