import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Edit, Sparkles, FileCheck, Trash2, Clock, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '../../lib/api';

export function ViewSingleNote() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const note = location.state?.note;
  const isReadOnly = location.state?.readOnly || false;
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteConfirm = async () => {
    if (note && !isReadOnly) {
      try {
        await api.notes.delete(note.id);
        toast.success(`"${note.title || "Untitled"}" deleted successfully`);
        window.dispatchEvent(new Event('notesUpdated'));
        navigate('/view');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
    setShowDeleteDialog(false);
  };

  const handleBack = () => {
    if (isReadOnly) {
      navigate('/messages');
    } else {
      navigate('/view');
    }
  };

  if (!note) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 size-12 text-yellow-400" />
            <h3 className="mb-2 text-lg text-white">No Note Selected</h3>
            <p className="text-gray-400 mb-4">Please select a note to view</p>
            <Button variant="outline" onClick={() => navigate('/view')} className="border-white/20 bg-white/5 text-gray-300">
              <ArrowLeft className="mr-2 size-4" />
              Back to Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const wordCount = note.content ? note.content.split(/\s+/).length : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack} className="border-white/20 bg-white/5 text-gray-300">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <div>
            <h1 className="mb-1 text-3xl font-bold text-white">
              {note.title || "Untitled"}
              {isReadOnly && <span className="ml-3 text-sm font-normal text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 rounded-md">Shared with you</span>}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {new Date(note.created_at).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          </div>
        </div>
        
        {/* Only show these top actions if the user owns the note */}
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button variant="default" onClick={() => navigate('/edit-note', { state: { note } })} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Edit className="mr-2 size-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => navigate('/summarize', { state: { note } })} className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
              <Sparkles className="mr-2 size-4" />
              Summarize
            </Button>
            <Button variant="outline" onClick={() => navigate('/evaluate', { state: { note } })} className="border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20">
              <FileCheck className="mr-2 size-4" />
              Evaluate
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={isReadOnly ? "lg:col-span-3" : "lg:col-span-2"}>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                  {note.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!isReadOnly && (
          <div className="space-y-4">
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="">
                <CardTitle className="text-white">Note Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Created:</span>
                  <span className="text-cyan-400">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Words:</span>
                  <span className="text-cyan-400 font-mono">{wordCount}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Characters:</span>
                  <span className="text-cyan-400 font-mono">{note.content.length}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Reading time:</span>
                  <span className="text-cyan-400 font-mono">
                    {Math.max(1, Math.ceil(wordCount / 200))} min
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="">
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="default" onClick={() => navigate('/edit-note', { state: { note } })} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <Edit className="mr-2 size-4" />
                  Edit Note
                </Button>
                <Button variant="outline" onClick={() => navigate('/summarize', { state: { note } })} className="w-full border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
                  <Sparkles className="mr-2 size-4" />
                  Summarize
                </Button>
                <Button variant="outline" onClick={() => navigate('/evaluate', { state: { note } })} className="w-full border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20">
                  <FileCheck className="mr-2 size-4" />
                  Evaluate
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="w-full border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">
                  <Trash2 className="mr-2 size-4" />
                  Delete Note
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-white/10 bg-gray-900">
          <AlertDialogHeader className="">
            <AlertDialogTitle className="text-white">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete "{note?.title || "Untitled"}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="border-white/20 bg-white/5 text-gray-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 text-white hover:bg-rose-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}