import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  CheckCircle2,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  ShieldAlert,
  AlertCircle,
  Info,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../api';

interface ExportModalProps {
  exportTarget: { type: 'paper' | 'session'; id: string } | null;
  onClose: () => void;
  onRefreshNotifications?: () => void;
}

export type ExportFormat =
  | 'highlighted_pdf'
  | 'original_pdf'
  | 'annotated_report'
  | 'csv'
  | 'json'
  | 'markdown'
  | 'bibtex';

export const ExportModal: React.FC<ExportModalProps> = ({
  exportTarget,
  onClose,
  onRefreshNotifications,
}) => {
  const [format, setFormat] = useState<ExportFormat>('highlighted_pdf');
  const [content, setContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [threshold, setThreshold] = useState<number>(60);
  const [downloadStatus, setDownloadStatus] = useState<{
    state: 'idle' | 'generating' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  useEffect(() => {
    if (exportTarget) {
      setDownloadStatus({ state: 'idle' });
      if (exportTarget.type === 'session') {
        setFormat('markdown');
        loadTextExport('markdown');
      } else {
        if (format !== 'highlighted_pdf' && format !== 'original_pdf') {
          loadTextExport(format);
        }
      }
    }
  }, [exportTarget, format]);

  const loadTextExport = async (selectedFormat: ExportFormat) => {
    if (!exportTarget) return;
    if (selectedFormat === 'highlighted_pdf' || selectedFormat === 'original_pdf') return;

    setLoading(true);
    setDownloadStatus({ state: 'idle' });
    try {
      const res = await api.generateExport(
        exportTarget.type,
        exportTarget.id,
        selectedFormat as any
      );
      setContent(res.content);
      setFilename(res.filename);
    } catch (e: any) {
      console.error('Export error:', e);
      setContent('Failed to generate export for this format.');
      setDownloadStatus({ state: 'error', message: e?.message || 'Failed to load text export.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!exportTarget) return;
    if (downloadStatus.state === 'generating') return; // Prevent duplicate clicks

    // 1. Highlighted PDF Download
    if (format === 'highlighted_pdf') {
      setDownloadStatus({
        state: 'generating',
        message: 'Extracting text coordinates and generating in-place highlighted PDF...',
      });
      try {
        const { blob, filename: dlFilename } = await api.downloadHighlightedPdfBlob(
          exportTarget.id,
          threshold
        );
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = dlFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloadStatus({
          state: 'success',
          message: `Highlighted PDF successfully downloaded: "${dlFilename}"`,
        });
        if (onRefreshNotifications) onRefreshNotifications();
      } catch (err: any) {
        console.error('Highlighted PDF export error:', err);
        setDownloadStatus({
          state: 'error',
          message: err?.message || 'Failed to generate highlighted PDF. Please try again.',
        });
        if (onRefreshNotifications) onRefreshNotifications();
      }
      return;
    }

    // 2. Original PDF Download
    if (format === 'original_pdf') {
      setDownloadStatus({
        state: 'generating',
        message: 'Retrieving unmodified original research paper from disk...',
      });
      try {
        const { blob, filename: dlFilename } = await api.downloadOriginalPdfBlob(exportTarget.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = dlFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloadStatus({
          state: 'success',
          message: `Original PDF successfully downloaded: "${dlFilename}"`,
        });
        if (onRefreshNotifications) onRefreshNotifications();
      } catch (err: any) {
        console.error('Original PDF download error:', err);
        setDownloadStatus({
          state: 'error',
          message: err?.message || 'Failed to download original PDF file.',
        });
        if (onRefreshNotifications) onRefreshNotifications();
      }
      return;
    }

    // 3. Textual / Data Formats (Markdown, CSV, JSON, BibTeX)
    const mimeTypes: Record<string, string> = {
      annotated_report: 'text/markdown;charset=utf-8',
      markdown: 'text/markdown;charset=utf-8',
      bibtex: 'application/x-bibtex;charset=utf-8',
      csv: 'text/csv;charset=utf-8',
      json: 'application/json;charset=utf-8',
    };

    const mime = mimeTypes[format] || 'text/plain;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ext = format === 'csv' ? 'csv' : format === 'json' ? 'json' : format === 'bibtex' ? 'bib' : 'md';
    link.download = filename || `report_${exportTarget.id}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadStatus({
      state: 'success',
      message: `File downloaded: "${link.download}"`,
    });
  };

  if (!exportTarget) return null;

  const isPaper = exportTarget.type === 'paper';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Export Research Intelligence &amp; PDF Highlighting
              </h3>
              <p className="text-[11px] text-slate-400">
                Target: {isPaper ? 'Research Paper' : 'Context Explorer Session'} (ID: {exportTarget.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        {isPaper ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {/* 1. Highlighted PDF */}
            <button
              onClick={() => {
                setFormat('highlighted_pdf');
                setDownloadStatus({ state: 'idle' });
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'highlighted_pdf'
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <FileCheck className="w-4 h-4 text-indigo-400 mb-1" />
              <span className="text-xs font-semibold">Highlighted PDF</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Exact Text Highlights</span>
            </button>

            {/* 2. Original PDF */}
            <button
              onClick={() => {
                setFormat('original_pdf');
                setDownloadStatus({ state: 'idle' });
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'original_pdf'
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-xs font-semibold">Original PDF</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Unmodified Upload</span>
            </button>

            {/* 3. Annotated Report */}
            <button
              onClick={() => {
                setFormat('annotated_report');
                setDownloadStatus({ state: 'idle' });
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'annotated_report'
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-xs font-semibold">Annotated Report</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Full Markdown Audit</span>
            </button>

            {/* 4. CSV Analysis Data */}
            <button
              onClick={() => {
                setFormat('csv');
                setDownloadStatus({ state: 'idle' });
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'csv'
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-xs font-semibold">CSV Data</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Sentence Register</span>
            </button>

            {/* 5. JSON Analysis Data */}
            <button
              onClick={() => {
                setFormat('json');
                setDownloadStatus({ state: 'idle' });
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'json'
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <FileCode className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-xs font-semibold">JSON Data</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Structured Nodes</span>
            </button>

            {/* 6. BibTeX Citation */}
            <button
              onClick={() => {
                setFormat('bibtex');
                setDownloadStatus({ state: 'idle' });
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                format === 'bibtex'
                  ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <FileCode className="w-4 h-4 text-slate-400 mb-1" />
              <span className="text-xs font-semibold">BibTeX</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Academic Citation</span>
            </button>
          </div>
        ) : (
          /* Context Session Format Toggle */
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Format:</span>
            <button
              onClick={() => setFormat('markdown')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-indigo-600/20 border-indigo-500 text-indigo-300"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown Intelligence Dossier (.md)</span>
            </button>
          </div>
        )}

        {/* Dynamic Status Notification Alert Banner */}
        {downloadStatus.state !== 'idle' && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
              downloadStatus.state === 'generating'
                ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200'
                : downloadStatus.state === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {downloadStatus.state === 'generating' && (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
              )}
              {downloadStatus.state === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {downloadStatus.state === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{downloadStatus.message}</span>
            </div>
            {downloadStatus.state !== 'generating' && (
              <button
                onClick={() => setDownloadStatus({ state: 'idle' })}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Format Specific Display Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
          {format === 'highlighted_pdf' ? (
            /* Highlighted PDF Feature Box */
            <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Export AI Analysis — Highlighted PDF Document
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Generates a downloadable PDF based directly on your original uploaded document with all flagged sentences and paragraphs highlighted in-place across pages, mapped via exact coordinate bounding boxes.
                      </p>
                    </div>
                  </div>

                  {/* Configurable Threshold Selector inside Modal */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl shrink-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] text-slate-400">Threshold:</span>
                    <select
                      value={threshold}
                      onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    >
                      <option value="50">50% (Sensitive)</option>
                      <option value="60">60% (Balanced)</option>
                      <option value="70">70% (Conservative)</option>
                      <option value="80">80% (Strict)</option>
                    </select>
                  </div>
                </div>

                {/* Color Legend Box */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    In-Document Highlighting Legend
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded bg-rose-500/50 border border-rose-500 shrink-0" />
                      <span className="text-slate-200">
                        <strong>Red-orange:</strong> High AI Likelihood (&ge;65%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded bg-amber-500/50 border border-amber-500 shrink-0" />
                      <span className="text-slate-200">
                        <strong>Yellow-amber:</strong> Moderate AI Likelihood ({threshold}% - 64%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 shrink-0" />
                      <span className="text-slate-400">
                        <strong>No Highlight:</strong> Low AI Likelihood (&lt;{threshold}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-indigo-400 font-bold text-[10px]">[Page 1]</span>
                      <span className="text-slate-300">
                        Prepends Full Analysis Summary Cover Page
                      </span>
                    </div>
                  </div>
                </div>

                {/* Limitations notice */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Preserves original page dimensions, text streams, figures, formulas, and references without altering source content. Highlighting indicates a statistical stylometric pattern, not proof of machine generation.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownload}
                  disabled={downloadStatus.state === 'generating'}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadStatus.state === 'generating' ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Generating Highlighted PDF (Threshold: {threshold}%)...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Highlighted PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : format === 'original_pdf' ? (
            /* Original PDF Download Box */
            <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Download Original Research PDF</h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Download the exact pristine, unmodified source PDF document that was originally uploaded to ResearchLens.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>Source Document ID: <strong className="text-slate-200">{exportTarget.id}</strong></div>
                  <div>Integrity: <strong className="text-slate-200">SHA-256 Bit-for-bit exact copy</strong></div>
                  <div>Format: <strong className="text-slate-200">Unmodified PDF Document</strong></div>
                </div>
              </div>

              <div>
                <button
                  onClick={handleDownload}
                  disabled={downloadStatus.state === 'generating'}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadStatus.state === 'generating' ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Retrieving Original PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Original PDF File</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Text / Code / Markdown / CSV Preview */
            loading ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mr-2" />
                Generating structured report...
              </div>
            ) : (
              <textarea
                readOnly
                value={content}
                className="flex-1 w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none resize-none"
              />
            )
          )}
        </div>

        {/* Footer actions (for textual formats) */}
        {format !== 'highlighted_pdf' && format !== 'original_pdf' && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Content'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
