'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2, Edit3 } from 'lucide-react';
import { OSFile } from '@/hooks/useFileSystem';

export default function NotesApp({ fileSystem }: { fileSystem: any }) {
  const { files, addFile, updateFile, deleteFile } = fileSystem;
  const notes = files.filter((f: OSFile) => f.type === 'note');
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOpenAppEvent = (e: any) => {
      if (e.detail && e.detail.appId === 'notes' && e.detail.fileId) {
        setActiveNoteId(e.detail.fileId);
      }
    };
    window.addEventListener('open-app', handleOpenAppEvent);
    return () => window.removeEventListener('open-app', handleOpenAppEvent);
  }, []);

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find((n: OSFile) => n.id === activeNoteId);

  const handleAddNote = () => {
    const newNote = addFile({
      name: 'New Note',
      type: 'note',
      content: '',
      size: '0 KB',
      parentId: null
    });
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (id: string) => {
    deleteFile(id);
    if (activeNoteId === id) {
      const remainingNotes = notes.filter((n: OSFile) => n.id !== id);
      setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
    }
  };

  const handleUpdateNote = (id: string, field: 'name' | 'content', value: string) => {
    updateFile(id, { [field]: value });
  };

  const filteredNotes = notes.filter((n: OSFile) => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex bg-transparent text-white font-sans rounded-xl overflow-hidden border border-white/5">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-medium tracking-tight">Notes</h2>
          <button 
            onClick={handleAddNote}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Edit3 size={16} className="text-zinc-400" />
          </button>
        </div>
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredNotes.map((note: OSFile) => (
            <button
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`w-full text-left p-4 border-b border-white/5 transition-colors ${activeNoteId === note.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <h3 className="font-medium text-sm truncate mb-1">{note.name || 'Untitled Note'}</h3>
              <p className="text-xs text-zinc-500 truncate mb-2">{note.content || 'No additional text'}</p>
              <p className="text-[10px] text-zinc-600 font-medium">{new Date(note.modified).toLocaleDateString()}</p>
            </button>
          ))}
          {filteredNotes.length === 0 && (
            <div className="p-8 text-center text-zinc-600 text-sm">
              No notes found.
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-transparent">
        {activeNote ? (
          <>
            <div className="p-4 border-b border-white/10 flex justify-end">
              <button 
                onClick={() => handleDeleteNote(activeNote.id)}
                className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <input
                type="text"
                value={activeNote.name}
                onChange={(e) => handleUpdateNote(activeNote.id, 'name', e.target.value)}
                placeholder="Note Title"
                className="w-full bg-transparent text-3xl font-medium tracking-tight mb-6 outline-none placeholder:text-zinc-700"
              />
              <textarea
                value={activeNote.content}
                onChange={(e) => handleUpdateNote(activeNote.id, 'content', e.target.value)}
                placeholder="Start typing..."
                className="w-full h-full bg-transparent text-zinc-300 leading-relaxed outline-none resize-none placeholder:text-zinc-700"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Select a note or create a new one</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
