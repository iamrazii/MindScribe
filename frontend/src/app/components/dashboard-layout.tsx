import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import {
  FileText,
  Eye,
  FileCheck,
  PlusCircle,
  Search,
  LogOut,
  User,
  Sparkles,
  Home,
  Menu,
  X,
  Network,
  MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';

export function DashboardLayout({ user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Create Note', href: '/create', icon: PlusCircle },
    { name: 'View Notes', href: '/view', icon: Eye },
    { name: 'Summarize', href: '/summarize', icon: Sparkles },
    { name: 'Evaluate', href: '/evaluate', icon: FileCheck },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Knowledge Map', href: '/knowledge-map', icon: Network },
    { name: 'Chatbot', href: '/chatbot', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
            <div className="flex items-center gap-3">
              <FileText className="size-6 text-cyan-400" />
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Mindscribe
              </h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                    ${isActive
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="size-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-teal-600 shadow-inner">
                <User className="size-5 text-white" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-white">{user?.name || 'User'}</div>
                <div className="truncate text-xs text-gray-400">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
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

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
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

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-900/50">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}