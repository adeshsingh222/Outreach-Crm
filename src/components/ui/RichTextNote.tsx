import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Clock, Edit2, Eye, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Note = {
  id: string;
  content: string;
  timestamp: string;
};

interface RichTextNoteProps {
  notes: Note[];
  onAddNote: (content: string) => void;
  className?: string;
}

export function RichTextNote({ notes, onAddNote, className }: RichTextNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');

  const handleSave = () => {
    if (!content.trim()) return;
    onAddNote(content);
    setContent('');
    setIsEditing(false);
    setViewMode('write');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-foreground">Notes & Activity</h3>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded-md hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Note
          </button>
        )}
      </div>

      {isEditing && (
        <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
          <div className="flex items-center gap-1 border-b border-border p-1 bg-secondary">
            <button
              onClick={() => setViewMode('write')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                viewMode === 'write' ? "bg-surface text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Edit2 className="w-3.5 h-3.5" /> Write
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                viewMode === 'preview' ? "bg-surface text-foreground shadow-sm" : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
          
          <div className="p-4 min-h-[120px]">
            {viewMode === 'write' ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a note... (Markdown supported)"
                className="w-full h-full min-h-[100px] resize-y outline-none bg-transparent text-sm text-foreground placeholder:text-foreground-faint"
                autoFocus
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground">
                {content.trim() ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-foreground-faint italic">Nothing to preview</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-2 p-3 border-t border-border bg-secondary">
            <button 
              onClick={() => {
                setIsEditing(false);
                setContent('');
                setViewMode('write');
              }}
              className="px-3 py-1.5 text-[13px] font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.length === 0 && !isEditing && (
          <div className="p-8 text-center bg-surface border border-border border-dashed rounded-lg">
            <p className="text-[13px] text-foreground-muted">No notes yet. Click 'Add Note' to create one.</p>
          </div>
        )}
        
        {notes.map((note) => (
          <div key={note.id} className="p-4 bg-surface border border-border rounded-lg shadow-card space-y-3">
            <div className="flex items-center justify-between text-[11px] text-foreground-faint font-medium">
              <div className="flex items-center gap-1.5 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {new Date(note.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground">
              <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
