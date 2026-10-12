import React, { useState } from 'react';
import {
  Download,
  Copy,
  CheckCircle2,
  X,
  FileText,
  FileCode,
} from 'lucide-react';
import { api } from '../api';

interface ExportModalProps {
  exportTarget: { type: 'paper' | 'session'; id: string } | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ exportTarget, onClose }) => {
  const [format, setFormat] = useState<'markdown' | 'bibtex'>('markdown');
  const [content, setContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (exportTarget) {
      loadExport(format);
    }
  }, [exportTarget, format]);

  const loadExport = async (selectedFormat: 'markdown' | 'bibtex') => {
    if (!exportTarget) return;
    setLoading(true);
    try {
      const res = await api.generateExport(exportTarget.type, exportTarget.id, selectedFormat);
      setContent(res.content);
      setFilename(res.filename);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `report.${format === 'bibtex' ? 'bib' : 'md'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!exportTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Export Research Intelligence Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Select Format:</span>
          <button
            onClick={() => setFormat('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              format === 'markdown'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown (.md)</span>
          </button>

          {exportTarget.type === 'paper' && (
            <button
              onClick={() => setFormat('bibtex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                format === 'bibtex'
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>BibTeX (.bib)</span>
            </button>
          )}
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[280px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mr-2" />
              Formatting report...
            </div>
          ) : (
            <textarea
              readOnly
              value={content}
              className="flex-1 w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none resize-none"
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
