'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Globe, ExternalLink, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function GoogleApp({ params }: { params?: any }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'web' | 'image'>('web');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        setHasKey(await window.aistudio.hasSelectedApiKey());
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    if (params?.query) {
      setQuery(params.query);
      // Trigger search after a short delay to ensure key is checked
      setTimeout(() => {
        handleSearch();
      }, 500);
    }
  }, [params]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (!hasKey) {
      setError('Please select an API key first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the platform-injected API_KEY if available.
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error('No API key available.');
      }
      
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      if (searchType === 'web') {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Search for: ${query}. Provide a list of relevant websites with titles, URLs, and brief descriptions.`,
          config: {
            systemInstruction: "Provide a concise response, limited to 2000 tokens.",
            tools: [{ googleSearch: {} }],
            toolConfig: { includeServerSideToolInvocations: true }
          },
        });

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const searchResults = chunks.map((chunk: any) => ({
          title: chunk.web?.title || 'Search Result',
          url: chunk.web?.uri || '#',
          snippet: response.text || 'No description available.'
        })).filter((res: any) => res.url !== '#');

        setResults(searchResults.length > 0 ? searchResults : [{
          title: 'AI Summary',
          url: '#',
          snippet: response.text || 'No results found.'
        }]);
      } else {
        // Image search
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [{ text: `Search for images of: ${query}` }],
          },
          config: {
            tools: [{
              googleSearch: {
                searchTypes: { webSearch: {}, imageSearch: {} }
              }
            }],
          },
        });

        const images: any[] = [];
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            images.push({
              url: `data:image/png;base64,${part.inlineData.data}`,
              title: query
            });
          }
        }
        setResults(images);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      if (err.message.includes('PERMISSION_DENIED') || err.message.includes('Requested entity was not found.')) {
        setError('Permission denied or API key issue. Please ensure you have selected a valid API key.');
      } else {
        setError('Failed to fetch results. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadData = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search_results.json';
    a.click();
  };

  const downloadImage = (url: string, title: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#202124] text-white">
      <div className="p-6 border-b border-white/10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Globe size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Google Search</h1>
        </div>

        <div className="flex gap-4 mb-2">
          <button onClick={() => setSearchType('web')} className={`px-4 py-1 rounded-full text-sm ${searchType === 'web' ? 'bg-blue-600' : 'bg-[#303134]'}`}>Web</button>
          <button onClick={() => setSearchType('image')} className={`px-4 py-1 rounded-full text-sm ${searchType === 'image' ? 'bg-blue-600' : 'bg-[#303134]'}`}>Images</button>
          {!hasKey && (
            <button onClick={handleSelectKey} className="px-4 py-1 rounded-full text-sm bg-amber-600 hover:bg-amber-700">Select API Key</button>
          )}
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full bg-[#303134] border border-[#5f6368] hover:bg-[#3c4043] focus:bg-[#3c4043] focus:outline-none rounded-full py-3 px-12 text-sm transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0a6]" size={18} />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" size={18} />
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {results.length > 0 && (
          <div className="max-w-2xl mx-auto mb-6 flex justify-end">
            <button onClick={downloadData} className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
              <Download size={16} /> Download Results
            </button>
          </div>
        )}

        <div className="max-w-2xl mx-auto flex flex-col gap-8">
          {searchType === 'web' ? results.map((result, idx) => (
            <div key={idx} className="group">
              <div className="text-xs text-[#bdc1c6] mb-1 truncate">{result.url}</div>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xl text-[#8ab4f8] hover:underline flex items-center gap-2">
                {result.title}
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <p className="text-sm text-[#bdc1c6] mt-1 leading-relaxed">{result.snippet}</p>
            </div>
          )) : (
            <div className="grid grid-cols-2 gap-4">
              {results.map((img, idx) => (
                <div key={idx} className="group relative">
                  <div className="w-full h-48 relative">
                    <Image 
                      src={img.url} 
                      alt={img.title} 
                      fill 
                      className="object-cover rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 z-10">
                    <button onClick={() => downloadImage(img.url, img.title)} className="p-2 bg-white rounded-full text-black"><Download size={16} /></button>
                    <button className="p-2 bg-white rounded-full text-black"><ImageIcon size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
