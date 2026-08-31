import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Terminal, BookOpen, Layers } from 'lucide-react';
import { CODE_DELIVERABLES } from '../data/pythonCode';

interface CodeArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeArtifactsModal: React.FC<CodeArtifactsModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<string>('data_loader.py');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentArtifact = CODE_DELIVERABLES[selectedFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentArtifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentArtifact.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Generate bundle script / markdown with all files
    let combined = `# P300 Speller BCI Project Bundle\n# Real EEG Data (BNCI2014_008) + EEGNet + Streamlit\n\n`;
    Object.values(CODE_DELIVERABLES).forEach((item) => {
      combined += `\n\n=======================================================\n`;
      combined += `FILE: ${item.filename}\n`;
      combined += `=======================================================\n\n`;
      combined += item.code;
    });

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'p300_bci_eegnet_complete_project.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0b10]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Python Source Code &amp; GitHub Deliverables
              </h2>
              <p className="text-xs text-slate-500">
                Production-grade MOABB, MNE-Python, TensorFlow EEGNet, and Streamlit implementation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 text-xs font-semibold hover:bg-blue-600/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            >
              <Download className="w-3.5 h-3.5" />
              Download All Files
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* File Tabs & Actions */}
        <div className="px-6 py-2.5 bg-[#0a0b10]/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {Object.keys(CODE_DELIVERABLES).map((key) => {
              const isSelected = selectedFile === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedFile(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)] font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-800 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy File</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSingle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-800 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content Viewport */}
        <div className="flex-1 overflow-auto bg-[#0a0b10] p-6 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <div className="mb-3 pb-3 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
            <span>{currentArtifact.description}</span>
            <span className="text-emerald-400 font-bold">{currentArtifact.language.toUpperCase()}</span>
          </div>
          <pre className="whitespace-pre overflow-x-auto text-slate-300">
            <code>{currentArtifact.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
