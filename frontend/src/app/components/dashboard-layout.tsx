import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import {
  Eye,
  PlusCircle,
  Search,
  LogOut,
  User,
  Sparkles,
  Home,
  Menu,
  X,
  Network,
  MessageSquare,
  FileCheck,
  Trash2,
  Inbox // Added Inbox icon
} from 'lucide-react';
import { Button } from './ui/button';

interface DashboardLayoutProps {
  user?: {
    username?: string;
    email?: string;
    profile_picture_url?: string;
  } | null;
  onLogout: () => void;
}

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Note', href: '/create', icon: PlusCircle },
    { name: 'View Notes', href: '/view', icon: Eye },
    { name: 'Messages', href: '/messages', icon: Inbox }, 
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Knowledge Map', href: '/knowledge-map', icon: Network },
    { name: 'Smart Search', href: '/chatbot', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 -translate-x-full border-r border-white/10 bg-slate-900/50 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : ''
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-white">
              <Sparkles className="size-5 text-cyan-400" />
              <span>MindScribe</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (location.pathname.startsWith('/view-note') && item.href === '/view') || (location.pathname.startsWith('/edit-note') && item.href === '/view');
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="size-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link to="/profile" className="mb-4 flex items-center gap-3 px-2 hover:bg-white/5 rounded-lg p-2 transition-colors cursor-pointer group">
              <div className="relative size-10 shrink-0">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="size-full rounded-full object-cover border border-white/20 group-hover:border-cyan-400 transition-colors" />
                ) : (
                  <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 border border-white/20 group-hover:border-cyan-400 transition-colors">
                    <User className="size-5 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{user?.username || 'User'}</div>
                <div className="truncate text-xs text-gray-400">{user?.email || 'user@example.com'}</div>
              </div>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="w-full border-white/20 bg-transparent text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="mr-2 size-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-black/20 px-4 backdrop-blur-sm lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white lg:hidden"
          >
            <Menu className="size-6" />
          </button>
          <div className="flex-1" />
          <div className="hidden text-sm font-medium text-gray-300 sm:block">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}