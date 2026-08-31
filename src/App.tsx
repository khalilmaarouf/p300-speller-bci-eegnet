import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MatrixSpeller } from './components/MatrixSpeller';
import { ErpWaveformViewer } from './components/ErpWaveformViewer';
import { TopomapViewer } from './components/TopomapViewer';
import { SignalProcessingPipeline } from './components/SignalProcessingPipeline';
import { ModelArchitecture } from './components/ModelArchitecture';
import { ClinicalQuickSpeech } from './components/ClinicalQuickSpeech';
import { CodeArtifactsModal } from './components/CodeArtifactsModal';
import { SUBJECT_PROFILES } from './data/bciDataset';
import { SubjectProfile } from './types';
import { Brain, Activity, ShieldCheck, Download, Code2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('speller');
  const [selectedSubject, setSelectedSubject] = useState<SubjectProfile>(SUBJECT_PROFILES[0]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Telemetry Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        subjects={SUBJECT_PROFILES}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {activeTab === 'speller' && (
          <MatrixSpeller
            subject={selectedSubject}
            soundEnabled={soundEnabled}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'erp' && (
          <ErpWaveformViewer subject={selectedSubject} />
        )}

        {activeTab === 'topomap' && (
          <TopomapViewer subject={selectedSubject} />
        )}

        {activeTab === 'pipeline' && (
          <SignalProcessingPipeline />
        )}

        {activeTab === 'eegnet' && (
          <ModelArchitecture />
        )}

        {activeTab === 'quick-speech' && (
          <ClinicalQuickSpeech
            subject={selectedSubject}
            soundEnabled={soundEnabled}
          />
        )}
      </main>

      {/* Clinical Sleek Footer Banner */}
      <footer id="app-footer" className="relative z-10 border-t border-slate-800/80 bg-[#090a10]/95 backdrop-blur-md py-4 px-4 lg:px-6 text-[13px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Benchmark Telemetry Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.7)] animate-pulse"></div>
            <span className="text-slate-300 text-xs sm:text-[13px]">
              Benchmark: <strong className="text-white font-mono">MOABB BNCI2014_008</strong> <span className="text-slate-500 font-mono text-[11px] hidden md:inline">(BCI Competition III • 64 Channels)</span>
            </span>
          </div>

          {/* Center / Right: Author & Source Code Action Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[13px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              Developed by{' '}
              <a
                id="author-github-link"
                href="https://github.com/khalilmaarouf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-200 hover:text-cyan-300 transition-all duration-200 underline decoration-slate-700 hover:decoration-cyan-400 underline-offset-4 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              >
                Khalil Maarouf
              </a>
            </span>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <a
              id="view-source-github-link"
              href="https://github.com/khalilmaarouf/p300-speller-bci-eegnet.git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all duration-200 text-xs sm:text-[13px] font-medium shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>View Source Code</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Python Code & Deliverables Hub Modal */}
      <CodeArtifactsModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
