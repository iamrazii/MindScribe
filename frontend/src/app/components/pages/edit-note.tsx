import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Save, Loader2, ArrowLeft, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { api } from '../../lib/api';

export function EditNote() {
  const navigate = useNavigate();
  const location = useLocation();
  const noteData = location.state?.note;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (noteData) {
      setTitle(noteData.title || '');
      setContent(noteData.content || '');
    }
  }, [noteData]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    setIsSaving(true);
    try {
      await api.notes.update(noteData.id, {
        title: title.trim(),
        content: content.trim()
      });
      toast.success('Note updated successfully!');
      window.dispatchEvent(new Event('notesUpdated'));
      navigate('/view');
    } catch (error) {
      toast.error('Failed to update note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/view');
  };

  if (!noteData) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 size-12 text-yellow-400" />
            <h3 className="mb-2 text-lg text-white">No Note Selected</h3>
            <p className="text-gray-400 mb-4">Please select a note to edit</p>
            <Button variant="outline" onClick={() => navigate('/view')} className="border-white/20 bg-white/5 text-gray-300">
              <ArrowLeft className="mr-2 size-4" />
              Back to Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Edit Note</h1>
          <p className="text-gray-300">Make changes to your note</p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="border-white/20 bg-white/5 text-gray-300">
          <X className="mr-2 size-4" />
          Cancel
        </Button>
      </div>

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
                    placeholder="Edit your note content..."
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
                        Save Changes
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="">
              <CardTitle className="text-white">Note Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Category:</span>
                <Badge variant="outline" className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
                  Note
                </Badge>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Created:</span>
                <span className="text-cyan-400">{new Date(noteData.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Original words:</span>
                <span className="text-cyan-400 font-mono">{noteData.content?.split(/\s+/).length || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="">
              <CardTitle className="text-white">Current Stats</CardTitle>
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