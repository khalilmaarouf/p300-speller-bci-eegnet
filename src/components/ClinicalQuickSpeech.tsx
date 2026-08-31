import React, { useState } from 'react';
import { Volume2, HeartHandshake, AlertCircle, Sparkles, CheckCircle2, Play, VolumeX, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { speakText, playBeep } from '../utils/eegnetInference';
import { SubjectProfile } from '../types';

interface ClinicalQuickSpeechProps {
  subject: SubjectProfile;
  soundEnabled: boolean;
}

interface QuickPhrase {
  id: string;
  label: string;
  category: 'emergency' | 'basic' | 'comfort' | 'social';
  iconColor: string;
}

export const ClinicalQuickSpeech: React.FC<ClinicalQuickSpeechProps> = ({
  subject,
  soundEnabled,
}) => {
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [lastSpoken, setLastSpoken] = useState<string>('');
  const [flashingIndex, setFlashingIndex] = useState<number | null>(null);

  const phrases: QuickPhrase[] = [
    { id: 'yes', label: 'YES', category: 'basic', iconColor: 'text-emerald-400' },
    { id: 'no', label: 'NO', category: 'basic', iconColor: 'text-rose-400' },
    { id: 'nurse', label: 'CALL NURSE', category: 'emergency', iconColor: 'text-amber-400' },
    { id: 'water', label: 'WATER PLEASE', category: 'comfort', iconColor: 'text-cyan-400' },
    { id: 'pain', label: 'PAIN MEDICATION', category: 'emergency', iconColor: 'text-rose-400' },
    { id: 'thank_you', label: 'THANK YOU', category: 'social', iconColor: 'text-emerald-400' },
    { id: 'reposition', label: 'REPOSITION BED', category: 'comfort', iconColor: 'text-purple-400' },
    { id: 'family', label: 'CALL FAMILY', category: 'social', iconColor: 'text-blue-400' },
    { id: 'suction', label: 'SUCTION NEEDED', category: 'emergency', iconColor: 'text-amber-400' },
  ];

  const triggerP300Selection = async (phrase: QuickPhrase) => {
    if (isDecoding) return;
    setIsDecoding(true);
    setActivePhraseId(phrase.id);

    // Flash through options rapidly to simulate P300 Oddball elicitation
    const targetIdx = phrases.findIndex((p) => p.id === phrase.id);

    for (let round = 0; round < 4; round++) {
      const order = Array.from({ length: phrases.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      for (const idx of order) {
        setFlashingIndex(idx);
        if (soundEnabled) {
          playBeep(idx === targetIdx ? 980 : 500, 30);
        }
        await new Promise((res) => setTimeout(res, 90));
        setFlashingIndex(null);
        await new Promise((res) => setTimeout(res, 60));
      }
    }

    setFlashingIndex(targetIdx);
    setLastSpoken(phrase.label);
    speakText(phrase.label);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    await new Promise((res) => setTimeout(res, 1000));
    setFlashingIndex(null);
    setIsDecoding(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartHandshake className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-light text-white tracking-tight">
              Clinical ALS &amp; Locked-In Syndrome (LIS) <span className="font-bold text-blue-500">Assistive Voice Board</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Rapid high-contrast P300 selection grid designed for paralyzed individuals to vocalize essential needs with minimal cognitive workload.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active TTS Speech Synthesizer
          </span>
        </div>
      </div>

      {/* Voice Output Banner */}
      <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block font-semibold">
              Vocalized Speech Output
            </span>
            <h3 className="text-xl font-bold font-mono text-emerald-400">
              {lastSpoken ? `"${lastSpoken}"` : 'Select a clinical phrase below to trigger P300 thought-to-speech...'}
            </h3>
          </div>
        </div>

        {lastSpoken && (
          <button
            onClick={() => speakText(lastSpoken)}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/40 text-xs font-semibold hover:bg-blue-600/30 flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.2)]"
          >
            <Volume2 className="w-4 h-4" />
            Re-Speak
          </button>
        )}
      </div>

      {/* Grid of Quick Phrases */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {phrases.map((phrase, idx) => {
          const isFlashing = flashingIndex === idx;
          const isEmergency = phrase.category === 'emergency';

          let cardStyle = 'bg-[#0d0f16] border-slate-800 hover:border-slate-700 text-slate-200';

          if (isFlashing) {
            cardStyle = 'bg-blue-500 text-white border-blue-300 ring-4 ring-blue-400/50 shadow-[0_0_25px_rgba(59,130,246,0.8)] scale-105 z-20 font-black';
          } else if (isEmergency) {
            cardStyle = 'bg-[#0d0f16] border-rose-900/30 hover:border-rose-700/50 text-slate-100';
          }

          return (
            <button
              key={phrase.id}
              disabled={isDecoding}
              onClick={() => triggerP300Selection(phrase)}
              className={`p-6 rounded-2xl border text-left transition-all flex flex-col justify-between h-36 relative cursor-pointer shadow-lg disabled:opacity-60 ${cardStyle}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                  isEmergency ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {phrase.category}
                </span>

                {isEmergency && <ShieldAlert className="w-4 h-4 text-rose-400" />}
              </div>

              <div>
                <h3 className="text-xl font-bold tracking-tight font-mono">
                  {phrase.label}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>P300 ODDBALL TARGET</span>
                <span className="flex items-center gap-1 text-blue-400 font-semibold">
                  <Play className="w-3 h-3 fill-blue-400" /> Click to Decode
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
