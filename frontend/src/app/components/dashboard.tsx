import React from 'react'; 
import { 
  FileText, 
  Eye, 
  FileCheck, 
  PlusCircle, 
  Search,
  LogOut,
  User,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface DashboardProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const actions = [
    {
      title: 'Create a Note',
      description: 'Start a new note with AI assistance',
      icon: PlusCircle,
      color: 'from-blue-500 to-cyan-500',
      action: () => console.log('Create note'),
    },
    {
      title: 'View Notes',
      description: 'Browse and manage your notes',
      icon: Eye,
      color: 'from-purple-500 to-pink-500',
      action: () => console.log('View notes'),
    },
    {
      title: 'Summarize Note',
      description: 'Get AI-powered summaries',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      action: () => console.log('Summarize'),
    },
    {
      title: 'Evaluate Note',
      description: 'Analyze and improve your notes',
      icon: FileCheck,
      color: 'from-green-500 to-emerald-500',
      action: () => console.log('Evaluate'),
    },
    {
      title: 'Search Notes',
      description: 'Find notes quickly with search',
      icon: Search,
      color: 'from-indigo-500 to-blue-500',
      action: () => console.log('Search'),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-sans">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="size-8 text-purple-400" />
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Mindscribe
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <User className="size-4 text-gray-300" />
                <span className="text-sm text-gray-200">{user.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="mr-2 size-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-4xl font-bold tracking-tight text-white">
            Welcome back, {user.name}!
          </h2>
          <p className="text-lg text-gray-300">
            What would you like to do today?
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="group relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
                onClick={action.action}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-10`} />
                <CardHeader className="relative z-10"> {/* Added className to fix TS2741 */}
                  <div className={`mb-3 flex size-12 items-center justify-center rounded-lg bg-gradient-to-br ${action.color}`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{action.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10"> {/* Added className to fix TS2741 */}
                  <div className="flex items-center text-sm text-purple-400 group-hover:text-purple-300">
                    Get started
                    <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-2 text-3xl font-bold text-white">24</div>
            <div className="text-sm text-gray-300">Total Notes</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-2 text-3xl font-bold text-white">12</div>
            <div className="text-sm text-gray-300">Notes This Week</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-2 text-3xl font-bold text-white">5.2k</div>
            <div className="text-sm text-gray-300">Words Written</div>
          </div>
        </div>
      </main>
    </div>
  );
}