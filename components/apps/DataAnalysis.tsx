import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Bot, Send, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export default function DataAnalysis() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('Provide a summary of this data and identify any key trends.');
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setInsights('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file.');
          console.error(results.errors);
          return;
        }
        if (results.data.length > 0) {
          setColumns(Object.keys(results.data[0] as object));
          setData(results.data);
        } else {
          setError('The CSV file is empty.');
        }
      },
      error: (error: any) => {
        setError(error.message);
      }
    });
  };

  const handleAnalyze = async () => {
    if (data.length === 0) {
      setError('Please upload data first.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Convert data back to CSV string for the prompt, limit rows if too large
      const sampleSize = Math.min(data.length, 100); // Send up to 100 rows to avoid token limits
      const sampleData = data.slice(0, sampleSize);
      const csvString = Papa.unparse(sampleData);
      
      const fullPrompt = `
You are an expert data analyst. I am providing you with a dataset in CSV format.
${data.length > sampleSize ? `Note: This is a sample of the first ${sampleSize} rows out of ${data.length} total rows.` : ''}

Dataset:
\`\`\`csv
${csvString}
\`\`\`

User Request:
${prompt}

Please analyze the data and provide your insights in Markdown format.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: fullPrompt,
      });

      setInsights(response.text || 'No insights generated.');
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-800">Data Analysis Studio</h1>
            <p className="text-xs text-zinc-500">AI-powered insights for your CSV data</p>
          </div>
        </div>
        
        <div>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Upload size={16} />
            {fileName ? 'Change File' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Data Preview */}
        <div className="w-1/2 flex flex-col border-r border-zinc-200 bg-white">
          <div className="p-3 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-medium text-zinc-700">Data Preview</h2>
            {data.length > 0 && (
              <span className="text-xs text-zinc-500">{data.length} rows loaded</span>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {data.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                <p>Upload a CSV file to see preview</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      {columns.map((col, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-200">
                    {data.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        {columns.map((col, j) => (
                          <td key={j} className="px-4 py-2 whitespace-nowrap text-zinc-700">
                            {row[col]?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 50 && (
                  <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-50 border-t border-zinc-200">
                    Showing first 50 rows
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Analysis */}
        <div className="w-1/2 flex flex-col bg-zinc-50">
          <div className="p-3 border-b border-zinc-200 bg-white flex justify-between items-center shrink-0">
            <h2 className="text-sm font-medium text-zinc-700 flex items-center gap-2">
              <Bot size={16} className="text-indigo-500" />
              AI Insights
            </h2>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {insights ? (
              <div className="prose prose-sm prose-indigo max-w-none bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <Markdown>{insights}</Markdown>
              </div>
            ) : !loading && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Bot size={48} className="mb-4 opacity-20" />
                <p>Ask a question to generate insights</p>
              </div>
            )}
            
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-indigo-500">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p className="text-sm font-medium">Analyzing data...</p>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="p-4 bg-white border-t border-zinc-200 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask something about the data..."
                className="flex-1 px-4 py-2 bg-zinc-100 border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && data.length > 0) {
                    handleAnalyze();
                  }
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || data.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Analyze
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
