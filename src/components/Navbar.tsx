import React from 'react';
import { 
  Activity, 
  Brain, 
  Code2, 
  Layers, 
  Volume2, 
  VolumeX, 
  FileSpreadsheet, 
  Radio, 
  CheckCircle2, 
  Sliders
} from 'lucide-react';
import { SubjectProfile } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSubject: SubjectProfile;
  setSelectedSubject: (subject: SubjectProfile) => void;
  subjects: SubjectProfile[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenCodeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedSubject,
  setSelectedSubject,
  subjects,
  soundEnabled,
  setSoundEnabled,
  onOpenCodeModal,
}) => {
  return (
    <header className="bg-[#0d0f16]/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & BCI Telemetry */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.2)]">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                <h1 className="text-sm font-bold uppercase tracking-widest text-white">
                  NEUROSCRIBE <span className="text-blue-500 font-extrabold">v1.0</span>
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  64-CH EEG
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">
                P300 BRAIN-COMPUTER INTERFACE • EEGNET-V4
              </p>
            </div>
          </div>

          {/* Quick Hardware Status */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-slate-400 text-[11px]">ActiCAP 128Hz</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>IMPEDANCE &lt; 2.5kΩ</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#0a0b10] p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
          {[
            { id: 'speller', label: '6x6 Speller', icon: Activity },
            { id: 'erp', label: 'ERP Waveforms', icon: Radio },
            { id: 'topomap', label: 'Scalp Topo', icon: Layers },
            { id: 'pipeline', label: 'MNE Pipeline', icon: Sliders },
            { id: 'eegnet', label: 'EEGNet Model', icon: Brain },
            { id: 'quick-speech', label: 'ALS Voice', icon: Volume2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-white border border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.25)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Controls & Python Artifacts Button */}
        <div className="flex items-center gap-2">
          {/* Subject Switcher */}
          <select
            id="subject-selector"
            value={selectedSubject.id}
            onChange={(e) => {
              const s = subjects.find((subj) => subj.id === e.target.value);
              if (s) setSelectedSubject(s);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-blue-500 focus:outline-none font-mono"
          >
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id} className="bg-[#0d0f16]">
                {subj.name.split(' (')[0]} ({subj.condition})
              </option>
            ))}
          </select>

          {/* Sound Neurofeedback Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Disable Audio Feedback' : 'Enable Audio Feedback'}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Python Code Repository Modal Button */}
          <button
            id="open-code-modal-btn"
            onClick={onOpenCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Source Deliverables</span>
            <span className="sm:hidden">Code</span>
          </button>
        </div>
      </div>
    </header>
  );
};
