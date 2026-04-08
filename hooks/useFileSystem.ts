export interface OSFile {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'note';
  content?: string;
  size: string;
  modified: string;
  parentId: string | null;
}

import { useState, useEffect } from 'react';

export function useFileSystem() {
  const [files, setFiles] = useState<OSFile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('os-files');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: '1', name: 'Documents', type: 'folder', size: '--', modified: new Date().toISOString(), parentId: null },
      { id: '2', name: 'Images', type: 'folder', size: '--', modified: new Date().toISOString(), parentId: null },
      { id: '3', name: 'Welcome.txt', type: 'file', size: '1 KB', modified: new Date().toISOString(), parentId: null },
      { id: '4', name: 'Financial Report', type: 'note', content: 'Q3 results look promising...', size: '2 KB', modified: new Date().toISOString(), parentId: '1' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('os-files', JSON.stringify(files));
  }, [files]);

  const addFile = (file: Omit<OSFile, 'id' | 'modified'>) => {
    const newFile: OSFile = {
      ...file,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      modified: new Date().toISOString(),
    };
    setFiles([...files, newFile]);
    return newFile;
  };

  const updateFile = (id: string, updates: Partial<OSFile>) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...updates, modified: new Date().toISOString() } : f));
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id && f.parentId !== id)); // Also delete children
  };

  return { files, addFile, updateFile, deleteFile };
}
