'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatRelativeTime } from '@/lib/utils';

interface ContactNotesProps {
  contactId: string;
}

export function ContactNotes({ contactId }: ContactNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/notes?contactId=${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { content: string; isPrivate: boolean }) => {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          ...data,
        }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', contactId] });
      setNewNote('');
      setIsPrivate(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    createNoteMutation.mutate({ content: newNote, isPrivate });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Loading notes...</div>;
  }

  return (
    <div className="p-6">
      {/* Create Note Form */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={4}
          placeholder="Add a note about this contact..."
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span className="text-sm">Private note</span>
          </label>
          <button
            type="submit"
            disabled={createNoteMutation.isPending || !newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes && notes.length > 0 ? (
          notes.map((note: any) => (
            <div
              key={note.id}
              className={`p-4 border rounded-lg ${
                note.isPrivate ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium">{note.creator?.name || 'Unknown'}</span>
                  {note.isPrivate && (
                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                      Private
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(new Date(note.createdAt))}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              {note.mentions && note.mentions.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Mentions: {note.mentions.map((m: any) => m.user.name).join(', ')}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No notes yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
}

