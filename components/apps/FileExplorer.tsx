'use client';

import React, { useState } from 'react';
import { Folder, File, ChevronRight, Search, Grid, List, Plus, FileText, Trash2 } from 'lucide-react';
import { OSFile } from '@/hooks/useFileSystem';

export default function FileExplorer({ fileSystem }: { fileSystem: any }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { files, addFile, deleteFile } = fileSystem;

  const currentFiles = files.filter((f: OSFile) => 
    f.parentId === currentFolder && 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFolder = () => {
    addFile({
      name: 'New Folder',
      type: 'folder',
      size: '--',
      parentId: currentFolder
    });
  };

  const handleFileClick = (file: OSFile) => {
    if (file.type === 'folder') {
      setCurrentFolder(file.id);
    } else if (file.type === 'note') {
      window.dispatchEvent(new CustomEvent('open-app', { detail: { appId: 'notes' } }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-app', { detail: { appId: 'notes', fileId: file.id } }));
      }, 50);
    } else {
      console.log('Opening file:', file.name);
    }
  };

  const handleBack = () => {
    if (currentFolder) {
      const folder = files.find((f: OSFile) => f.id === currentFolder);
      setCurrentFolder(folder?.parentId || null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-3xl text-zinc-300 font-sans rounded-xl overflow-hidden border border-white/10">
      {/* Toolbar */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 gap-4 bg-black/20">
        <div className="flex gap-2 items-center">
          <button 
            onClick={handleBack}
            disabled={!currentFolder}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <button 
            onClick={handleCreateFolder}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Folder size={14} /> New Folder
          </button>
          <button 
            onClick={() => {
              addFile({
                name: 'New Note',
                type: 'note',
                content: '',
                size: '0 KB',
                parentId: currentFolder
              });
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <FileText size={14} /> New Note
          </button>
          <div className="w-px h-4 bg-white/10 self-center mx-1" />
          <button 
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
          ><Grid size={16} /></button>
          <button 
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
          ><List size={16} /></button>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input 
            type="text" 
            placeholder="Search files..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-white/10 p-4 space-y-6 overflow-y-auto bg-black/20">
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">Favorites</h4>
            <div className="space-y-1">
              {['Recent', 'Starred', 'Downloads'].map(item => (
                <div key={item} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer text-sm transition-colors">
                  <ChevronRight size={14} className="text-zinc-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">Locations</h4>
            <div className="space-y-1">
              {['This PC', 'Cloud Drive', 'Network'].map(item => (
                <div key={item} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer text-sm transition-colors">
                  <ChevronRight size={14} className="text-zinc-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {currentFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <Folder size={48} className="mb-4 opacity-20" />
              <p>This folder is empty</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-6">
              {currentFiles.map((file: OSFile) => (
                <div key={file.id} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                  <div 
                    onClick={() => handleFileClick(file)}
                    className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:scale-105 shadow-lg"
                  >
                    {file.type === 'folder' ? (
                      <Folder size={36} className="text-blue-400 drop-shadow-md" />
                    ) : file.type === 'note' ? (
                      <FileText size={36} className="text-amber-400 drop-shadow-md" />
                    ) : (
                      <File size={36} className="text-zinc-400 drop-shadow-md" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center truncate w-full group-hover:text-white transition-colors px-1">
                    {file.name}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-white/10">
                  <th className="pb-3 font-medium px-4">Name</th>
                  <th className="pb-3 font-medium px-4">Modified</th>
                  <th className="pb-3 font-medium px-4">Size</th>
                  <th className="pb-3 font-medium px-4"></th>
                </tr>
              </thead>
              <tbody>
                {currentFiles.map((file: OSFile) => (
                  <tr key={file.id} className="hover:bg-white/5 group cursor-pointer transition-colors border-b border-white/5 last:border-0">
                    <td className="py-3 px-4 flex items-center gap-3" onClick={() => handleFileClick(file)}>
                      {file.type === 'folder' ? (
                        <Folder size={16} className="text-blue-400" />
                      ) : file.type === 'note' ? (
                        <FileText size={16} className="text-amber-400" />
                      ) : (
                        <File size={16} className="text-zinc-400" />
                      )}
                      <span className="group-hover:text-white transition-colors">{file.name}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-500" onClick={() => handleFileClick(file)}>
                      {new Date(file.modified).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-zinc-500" onClick={() => handleFileClick(file)}>
                      {file.size}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 border-t border-white/10 px-4 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-black/20">
        <span>{currentFiles.length} items</span>
        <span>1.2 GB Free of 10 GB</span>
      </div>
    </div>
  );
}
