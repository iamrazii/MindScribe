"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Clock, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Share2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  words: number;
  category: string;
}

export function ViewNotes() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // States for Share Functionality
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [shareEmail, setShareEmail] = useState('');

  const notes: Note[] = [
    {
      id: 1,
      title: 'Meeting Notes - Q1 Planning',
      content: 'Discussed project roadmap and key milestones for the upcoming quarter...',
      date: '2 hours ago',
      words: 450,
      category: 'Work',
    },
    {
      id: 2,
      title: 'Project Ideas',
      content: 'Brainstorming session for new features and improvements to the platform...',
      date: '1 day ago',
      words: 320,
      category: 'Ideas',
    },
    {
      id: 3,
      title: 'Research Notes - AI Technology',
      content: 'Comprehensive notes on the latest advancements in artificial intelligence...',
      date: '2 days ago',
      words: 890,
      category: 'Research',
    },
    {
      id: 4,
      title: 'Personal Goals 2026',
      content: 'Setting clear and achievable goals for personal and professional growth...',
      date: '3 days ago',
      words: 275,
      category: 'Personal',
    },
    {
      id: 5,
      title: 'Team Retrospective',
      content: 'Reflecting on the past sprint and identifying areas for improvement...',
      date: '1 week ago',
      words: 520,
      category: 'Work',
    },
    {
      id: 6,
      title: 'Book Summary - Deep Work',
      content: 'Key takeaways and insights from Cal Newport\'s book on focused productivity...',
      date: '1 week ago',
      words: 640,
      category: 'Learning',
    },
  ];

  const categories = ['all', 'Work', 'Ideas', 'Research', 'Personal', 'Learning'];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleShareClick = (note: Note) => {
    setActiveNote(note);
    setIsShareOpen(true);
  };

  const handleShareSubmit = () => {
    // Logic to send share request to backend
    console.log(`Sharing note "${activeNote?.title}" with ${shareEmail}`);
    setIsShareOpen(false);
    setShareEmail('');
  };

  return (
    <div className="p-6 lg:p-8 font-sans bg-transparent">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">View Notes</h1>
        <p className="text-gray-300">Browse and manage all your notes</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Input
            id="view-search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-white/20 bg-white/5 pl-10 text-white placeholder:text-gray-500"
          />
          <FileText className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? 'bg-cyan-600 text-white'
                    : 'border-white/20 bg-white/5 text-gray-300'
                }
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="group border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <CardHeader className="relative z-10">
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                    {note.category}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-8 p-0 text-gray-400 hover:text-cyan-400"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShareClick(note)}
                      className="size-8 p-0 text-gray-400 hover:text-blue-400"
                    >
                      <Share2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-8 p-0 text-gray-400 hover:text-emerald-400"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-8 p-0 text-gray-400 hover:text-rose-400"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-white">{note.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="mb-4 line-clamp-3 text-sm text-gray-300">{note.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{note.date}</span>
                  </div>
                  <span>{note.words} words</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
            <FileText className="mb-4 size-12 text-gray-500" />
            <h3 className="mb-2 text-lg text-white font-semibold">No notes found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="text-2xl font-bold text-white">{filteredNotes.length}</div>
            <div className="text-sm text-gray-400">Notes Displayed</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="text-2xl font-bold text-white">
              {filteredNotes.reduce((sum, note) => sum + note.words, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Words</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="p-4 relative z-10">
            <div className="text-2xl font-bold text-white">
              {filteredNotes.length > 0 
                ? Math.round(filteredNotes.reduce((sum, note) => sum + note.words, 0) / filteredNotes.length) 
                : 0}
            </div>
            <div className="text-sm text-gray-400">Avg Words/Note</div>
          </CardContent>
        </Card>
      </div>

      {/* Share Note Modal */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="border-white/10 bg-[#0f172a] text-white">
          <DialogHeader>
            <DialogTitle>Share "{activeNote?.title}"</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the email address of the person you want to collaborate with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="share-email"
              type="email"
              placeholder="user@example.com"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              size="default" 
              onClick={() => setIsShareOpen(false)} 
              className="border-white/20 text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              size="default"
              onClick={handleShareSubmit} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Share Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}