import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Save, Sparkles, Loader2, Wand2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { api } from '../../lib/api';

export function CreateNote() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [autoGenPrompt, setAutoGenPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAutoGenerate = async () => {
    if (!autoGenPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsAutoGenerating(true);
    try {
      const response = await api.notes.generate(autoGenPrompt);
      setContent(response.content || '');
      setTitle(response.title || autoGenPrompt);
      setAutoGenPrompt('');
      toast.success('Note generated! Edit and save when ready.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate note.');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!content.trim()) {
      toast.error('Please write some content first');
      return;
    }

    setIsAiSuggesting(true);
    try {
      const response = await api.notes.suggest(content);
      const suggestionText = response.suggestion || '';
      
      const suggestionsList = suggestionText.split('\n').filter((s: string) => s.trim().length > 0);
      
      const formattedSuggestions = suggestionsList.map((text: string, idx: number) => ({
        id: idx + 1,
        text: text.replace(/^[-*•\d.]+\s*/, ''),
      }));

      setAiSuggestions(formattedSuggestions);
      toast.success('AI suggestions generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to get suggestions.');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const insertSuggestion = (suggestionText: string) => {
    setContent(content + '\n\n💡 ' + suggestionText);
    toast.success('Suggestion inserted!');
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSaving(true);
    try {
      await api.notes.create({
        title: title.trim(),
        content: content.trim()
      });
      toast.success('Note saved successfully!');
      setTitle('');
      setContent('');
      setAiSuggestions([]);
      window.dispatchEvent(new Event('notesUpdated'));
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-white">Create a Note</h1>
        <p className="text-gray-300">Write your thoughts with AI assistance</p>
      </div>

      <Card className="mb-6 border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 backdrop-blur-sm">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-white">
            <Wand2 className="size-5" />
            AutoGeneration
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="flex gap-3">
            <Input
              placeholder="Enter a prompt to generate a note draft... (e.g., 'Machine Learning Basics')"
              value={autoGenPrompt}
              onChange={(e) => setAutoGenPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAutoGenerate()}
              className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-gray-400"
            />
            <Button
              variant="default"
              onClick={handleAutoGenerate}
              disabled={isAutoGenerating || !autoGenPrompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700"
            >
              {isAutoGenerating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 size-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-200">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-white/20 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-gray-200">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Start writing your note..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[400px] border-white/20 bg-white/5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="default"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-900/20"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        Save Note
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleAiSuggest}
                    disabled={isAiSuggesting || !content.trim()}
                    className="border-white/20 bg-white/5 text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50"
                  >
                    {isAiSuggesting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        Get AI Suggestions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {aiSuggestions.length > 0 && (
            <Card className="border-cyan-500/30 bg-cyan-500/5 backdrop-blur-sm">
              <CardHeader className="">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="size-5 text-cyan-400" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiSuggestions.map((suggestion: any) => (
                  <div
                    key={suggestion.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
                  >
                    <p className="text-sm text-gray-300">{suggestion.text}</p>
                    
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="">
              <CardTitle className="text-white">Note Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Characters:</span>
                <span className="text-cyan-400 font-mono">{content.length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Words:</span>
                <span className="text-cyan-400 font-mono">
                  {content.trim() ? content.trim().split(/\s+/).length : 0}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Reading time:</span>
                <span className="text-cyan-400 font-mono">
                  {Math.max(1, Math.ceil((content.trim() ? content.trim().split(/\s+/).length : 0) / 200))} min
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}