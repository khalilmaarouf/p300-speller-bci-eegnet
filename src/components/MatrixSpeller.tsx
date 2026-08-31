import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Volume2, 
  Brain, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Delete
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MATRIX_6X6 } from '../data/bciDataset';
import { SubjectProfile } from '../types';
import { runEEGNetCharacterInference, speakText, playBeep } from '../utils/eegnetInference';

interface MatrixSpellerProps {
  subject: SubjectProfile;
  soundEnabled: boolean;
  onSelectTab: (tab: string) => void;
}

export const MatrixSpeller: React.FC<MatrixSpellerProps> = ({
  subject,
  soundEnabled,
  onSelectTab,
}) => {
  const [targetWord, setTargetWord] = useState<string>('BRAIN');
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [decodedWord, setDecodedWord] = useState<string>('');
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [repetitions, setRepetitions] = useState<number>(5);
  const [flashDurationMs, setFlashDurationMs] = useState<number>(100);
  const [isiDurationMs, setIsiDurationMs] = useState<number>(75);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const [revealedCell, setRevealedCell] = useState<{ r: number; c: number } | null>(null);

  // Probability accumulators for current character
  const [rowScores, setRowScores] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [colScores, setColScores] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [liveConfidence, setLiveConfidence] = useState<number>(0);
  const [currentRepetition, setCurrentRepetition] = useState<number>(0);
  const [liveEEGValues, setLiveEEGValues] = useState<{ pz: number; cz: number; fz: number; oz: number }>({
    pz: 0.2,
    cz: 0.1,
    fz: -0.1,
    oz: 0.3,
  });

  const abortRef = useRef<boolean>(false);

  const targetChar = targetWord[currentCharIndex] || '';

  // Quick preset words
  const presetWords = ['BRAIN', 'MIND', 'THOUGHT', 'HELP', 'HELLO', 'BCI_P300'];

  const startSpelling = async () => {
    if (isRunning) return;
    setIsRunning(true);
    abortRef.current = false;
    setDecodedWord('');
    setCurrentCharIndex(0);

    const fullWord = targetWord.toUpperCase();

    for (let charIdx = 0; charIdx < fullWord.length; charIdx++) {
      if (abortRef.current) break;

      setCurrentCharIndex(charIdx);
      const targetChar = fullWord[charIdx];

      // Find target row and column coordinates in the 6x6 matrix
      let targetR = 0;
      let targetC = 0;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          if (MATRIX_6X6[r][c] === targetChar) {
            targetR = r;
            targetC = c;
          }
        }
      }

      setRevealedCell(null);
      const curRowProbs = [0, 0, 0, 0, 0, 0];
      const curColProbs = [0, 0, 0, 0, 0, 0];

      // Perform N repetitions of 12 flashes (6 rows + 6 columns)
      for (let rep = 0; rep < repetitions; rep++) {
        if (abortRef.current) break;
        setCurrentRepetition(rep + 1);

        // Flash rows in randomized order
        const rowOrder = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
        for (const r of rowOrder) {
          if (abortRef.current) break;
          setActiveRow(r);
          setActiveCol(null);

          const isTarget = r === targetR;
          if (soundEnabled) {
            playBeep(isTarget ? 980 : 520, 30);
          }

          // Simulate live EEG deflection on Pz/Cz
          setLiveEEGValues({
            pz: isTarget ? +(6.5 + Math.random() * 2.5).toFixed(1) : -(0.5 + Math.random() * 1.5).toFixed(1),
            cz: isTarget ? +(5.2 + Math.random() * 2.0).toFixed(1) : +(0.2 + Math.random() * 1.0).toFixed(1),
            fz: -(1.5 + Math.random() * 1.0).toFixed(1),
            oz: +(2.0 + Math.random() * 1.5).toFixed(1),
          });

          await new Promise((res) => setTimeout(res, flashDurationMs));
          setActiveRow(null);
          await new Promise((res) => setTimeout(res, isiDurationMs));

          // Accumulate realistic probability
          const prob = isTarget ? 0.85 + (Math.random() - 0.5) * 0.15 : 0.15 + (Math.random() - 0.5) * 0.15;
          curRowProbs[r] += Math.max(0.01, prob);
          setRowScores([...curRowProbs]);
        }

        // Flash columns in randomized order
        const colOrder = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
        for (const c of colOrder) {
          if (abortRef.current) break;
          setActiveRow(null);
          setActiveCol(c);

          const isTarget = c === targetC;
          if (soundEnabled) {
            playBeep(isTarget ? 980 : 520, 30);
          }

          setLiveEEGValues({
            pz: isTarget ? +(7.0 + Math.random() * 2.2).toFixed(1) : -(0.8 + Math.random() * 1.2).toFixed(1),
            cz: isTarget ? +(5.8 + Math.random() * 1.8).toFixed(1) : +(0.1 + Math.random() * 0.8).toFixed(1),
            fz: -(1.8 + Math.random() * 0.9).toFixed(1),
            oz: +(1.8 + Math.random() * 1.2).toFixed(1),
          });

          await new Promise((res) => setTimeout(res, flashDurationMs));
          setActiveCol(null);
          await new Promise((res) => setTimeout(res, isiDurationMs));

          const prob = isTarget ? 0.85 + (Math.random() - 0.5) * 0.15 : 0.15 + (Math.random() - 0.5) * 0.15;
          curColProbs[c] += Math.max(0.01, prob);
          setColScores([...curColProbs]);
        }
      }

      if (abortRef.current) break;

      // Run EEGNet inference to get final decoded character
      const inference = runEEGNetCharacterInference(
        targetChar,
        repetitions,
        subject.accuracy15Reps,
        subject.p300PeakLatencyMs
      );

      const decodedChar = inference.predictedChar;
      setRevealedCell({ r: inference.bestRow, c: inference.bestCol });
      setLiveConfidence(inference.confidence);
      setDecodedWord((prev) => prev + decodedChar);

      if (soundEnabled) {
        playBeep(1200, 150);
      }

      // Short pause before moving to next letter
      await new Promise((res) => setTimeout(res, 600));
    }

    setIsRunning(false);
    setActiveRow(null);
    setActiveCol(null);

    // If word completed successfully, play voice & trigger confetti!
    if (!abortRef.current && fullWord.length > 0) {
      if (soundEnabled) {
        speakText(fullWord.replace(/_/g, ' '));
      }
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6'],
        });
      } catch {
        // ignore
      }
    }
  };

  const stopSpelling = () => {
    abortRef.current = true;
    setIsRunning(false);
    setActiveRow(null);
    setActiveCol(null);
  };

  const resetAll = () => {
    stopSpelling();
    setDecodedWord('');
    setCurrentCharIndex(0);
    setRevealedCell(null);
    setRowScores([0, 0, 0, 0, 0, 0]);
    setColScores([0, 0, 0, 0, 0, 0]);
    setLiveConfidence(0);
    setCurrentRepetition(0);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWordInput.trim()) return;
    const sanitized = customWordInput.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (sanitized) {
      setTargetWord(sanitized);
      setCustomWordInput('');
      resetAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Goal & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Target and Output Card */}
        <div className="lg:col-span-8 bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-light text-white tracking-tight">
                Real-time P300 <span className="font-bold text-blue-500">Decoding Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRunning
                  ? `Currently observing ${activeRow !== null ? `Row ${activeRow + 1}` : activeCol !== null ? `Column ${activeCol + 1}` : 'Stimulation Sequence'} (Rep ${currentRepetition}/${repetitions})...`
                  : 'Focus gaze on the target character to elicit P300 Oddball parietal response.'}
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
                  isRunning
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-slate-600'}`} />
                {isRunning ? `DECODING (REP ${currentRepetition}/${repetitions})` : 'SYSTEM READY'}
              </div>
            </div>
          </div>

          {/* Target Sequence vs Text Output Buffer Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0b10] p-4 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase text-slate-500 mb-1.5 tracking-wider font-semibold block">
                Target Objective Sequence
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {targetWord.split('').map((char, idx) => {
                  const isCurrent = idx === currentCharIndex && isRunning;
                  const isDone = idx < currentCharIndex;
                  return (
                    <span
                      key={idx}
                      className={`w-9 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-base transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0a0b10] scale-105 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                          : isDone
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                  Text Output Buffer
                </span>
                {liveConfidence > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Confidence: {(liveConfidence / 100).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="bg-black/40 rounded-lg p-2.5 min-h-[44px] font-mono text-blue-400 text-sm overflow-hidden border border-slate-800/40 flex items-center gap-1.5 flex-wrap">
                {decodedWord ? (
                  decodedWord.split('').map((char, idx) => (
                    <span
                      key={idx}
                      className="w-7 h-7 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-sm"
                    >
                      {char}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-600 font-mono italic">
                    AWAITING EEG SIGNAL_
                  </span>
                )}
                {isRunning && <span className="animate-pulse inline-block w-2 h-4 bg-blue-400 ml-1"></span>}
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons & Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Presets:</span>
              {presetWords.map((word) => (
                <button
                  key={word}
                  disabled={isRunning}
                  onClick={() => {
                    setTargetWord(word);
                    resetAll();
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    targetWord === word
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>

            {/* Custom Word Input */}
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="text"
                maxLength={12}
                disabled={isRunning}
                placeholder="Custom text..."
                value={customWordInput}
                onChange={(e) => setCustomWordInput(e.target.value.toUpperCase())}
                className="bg-[#0a0b10] border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 w-32 focus:border-blue-500 focus:outline-none disabled:opacity-50 font-mono"
              />
              <button
                type="submit"
                disabled={isRunning || !customWordInput.trim()}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg border border-slate-700 font-semibold disabled:opacity-50 cursor-pointer"
              >
                Set
              </button>
            </form>
          </div>
        </div>

        {/* Right: Real-time Action & Session Metadata Card */}
        <div className="lg:col-span-4 bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                Session Metadata
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                {subject.id}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Subject Profile</span>
                <span className="text-blue-400 font-mono">{subject.name.split(' (')[0]}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Channels</span>
                <span className="text-blue-400 font-mono">64 EEG (10/20)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">P300 Peak Latency</span>
                <span className="text-blue-400 font-mono">{subject.p300PeakLatencyMs} ms</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Peak Voltage (Pz)</span>
                <span className="text-emerald-400 font-mono font-bold">+{subject.p300PeakAmplitudeUv} μV</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Throughput</span>
                <span className="text-emerald-400 font-mono font-bold">{subject.itrBitsPerMin} bpm</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
            {!isRunning ? (
              <button
                id="start-bci-btn"
                onClick={startSpelling}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-semibold shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>START ONLINE P300 DECODING</span>
              </button>
            ) : (
              <button
                id="stop-bci-btn"
                onClick={stopSpelling}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg text-xs font-semibold shadow-[0_0_15px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>HALT ACQUISITION LOOP</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={resetAll}
                disabled={isRunning}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET BUFFER
              </button>
              {decodedWord && (
                <button
                  onClick={() => speakText(decodedWord.replace(/_/g, ' '))}
                  className="py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold border border-blue-500/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  VOCALIZE
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main 6x6 Matrix & Live Oscilloscope Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* The 6x6 Farwell-Donchin Matrix */}
        <div className="lg:col-span-7 bg-[#0d0f16] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold block">
                6x6 Farwell-Donchin Matrix Grid
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                36 Characters (A-Z, 1-9, _)
              </span>
            </div>
            {targetChar && (
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest">Active Target</p>
                    <p className="text-base font-black text-white font-mono">{targetChar}</p>
                  </div>
                  {liveConfidence > 0 && (
                    <>
                      <div className="h-6 w-px bg-slate-800"></div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Confidence</p>
                        <p className="text-base font-black text-emerald-400 font-mono">{(liveConfidence / 100).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Matrix Grid Container */}
          <div 
            id="matrix-grid-container"
            className="w-full max-w-[460px] aspect-square grid grid-rows-6 gap-2 bg-[#0a0b10] p-3.5 rounded-2xl border border-slate-800/80 shadow-inner"
          >
            {MATRIX_6X6.map((row, rIdx) => {
              const isRowActive = activeRow === rIdx;
              return (
                <div key={rIdx} className="grid grid-cols-6 gap-2">
                  {row.map((char, cIdx) => {
                    const isColActive = activeCol === cIdx;
                    const isFlashing = isRowActive || isColActive;
                    const isTargetLetter = char === targetChar && isRunning;
                    const isRevealed = revealedCell?.r === rIdx && revealedCell?.c === cIdx;

                    let cellStyle = 'border border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700';

                    if (isRevealed) {
                      cellStyle = 'border border-emerald-500 bg-emerald-600/25 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-105 z-20 font-black';
                    } else if (isFlashing) {
                      cellStyle = 'border border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)] scale-105 z-10 font-bold';
                    } else if (isTargetLetter) {
                      cellStyle = 'border border-blue-500/50 bg-blue-950/40 text-blue-300';
                    }

                    return (
                      <div
                        key={cIdx}
                        id={`cell-${rIdx}-${cIdx}`}
                        className={`aspect-square flex items-center justify-center rounded-lg text-lg sm:text-xl font-bold font-mono transition-all duration-75 select-none relative cursor-default ${cellStyle}`}
                      >
                        {char}
                        {isTargetLetter && !isFlashing && !isRevealed && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="w-full max-w-[460px] mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)] inline-block" /> FLASH STIMULUS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> DECODED INTERSECTION
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-blue-950 border border-blue-500 inline-block" /> ATTENTION TARGET
            </span>
          </div>
        </div>

        {/* Right: Live Signal Oscilloscope & Probability Accumulators */}
        <div className="lg:col-span-5 space-y-4">
          {/* Real-time EEG Oscilloscope Stream */}
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Event-Related Potential (Pz/Cz)
                </h4>
              </div>
              <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                128 Hz MNE-STREAM
              </span>
            </div>

            {/* Microvolt Channel Bars */}
            <div className="space-y-2.5 bg-[#0a0b10] p-3.5 rounded-xl border border-slate-800/80">
              {[
                { name: 'Pz (Parietal P300)', val: liveEEGValues.pz, color: 'text-emerald-400', barBg: 'bg-emerald-500' },
                { name: 'Cz (Central P300)', val: liveEEGValues.cz, color: 'text-blue-400', barBg: 'bg-blue-500' },
                { name: 'Fz (Frontal N200)', val: liveEEGValues.fz, color: 'text-rose-400', barBg: 'bg-rose-500' },
                { name: 'Oz (Occipital P100)', val: liveEEGValues.oz, color: 'text-amber-400', barBg: 'bg-amber-500' },
              ].map((ch) => {
                const normWidth = Math.min(100, Math.max(0, (ch.val + 5) * 6.5));
                return (
                  <div key={ch.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-mono text-[11px]">{ch.name}</span>
                      <span className={`font-mono font-semibold text-[11px] ${ch.color}`}>
                        {ch.val > 0 ? `+${ch.val}` : ch.val} μV
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${ch.barBg} transition-all duration-75 rounded-full`}
                        style={{ width: `${normWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5 font-mono">
              LATENCY: <span className="text-blue-400">{subject.p300PeakLatencyMs}ms</span> • PEAK DEFLECTION: <span className="text-emerald-400">+{subject.p300PeakAmplitudeUv}μV</span>
            </p>
          </div>

          {/* Row and Column EEGNet Probability Accumulation */}
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                EEGNet Spatial Probability
              </h4>
              <button
                onClick={() => onSelectTab('eegnet')}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-0.5 cursor-pointer"
              >
                Model Specs <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Row Accumulator */}
              <div className="bg-[#0a0b10] p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1.5 font-semibold">
                  Row Logits (R1-R6)
                </span>
                <div className="space-y-1.5">
                  {rowScores.map((score, rIdx) => {
                    const maxR = Math.max(...rowScores, 0.01);
                    const percent = Math.min(100, Math.round((score / maxR) * 100));
                    const isLeader = score === maxR && score > 0.5;
                    return (
                      <div key={rIdx} className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="w-4 text-slate-500">R{rIdx + 1}</span>
                        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-150 ${
                              isLeader ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-slate-700'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-7 text-right text-slate-400">{score.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Col Accumulator */}
              <div className="bg-[#0a0b10] p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1.5 font-semibold">
                  Column Logits (C1-C6)
                </span>
                <div className="space-y-1.5">
                  {colScores.map((score, cIdx) => {
                    const maxC = Math.max(...colScores, 0.01);
                    const percent = Math.min(100, Math.round((score / maxC) * 100));
                    const isLeader = score === maxC && score > 0.5;
                    return (
                      <div key={cIdx} className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span className="w-4 text-slate-500">C{cIdx + 1}</span>
                        <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-150 ${
                              isLeader ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-700'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-7 text-right text-slate-400">{score.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-[#0a0b10] border border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">COORDS:</span>
              <span className="text-slate-300">
                (R{rowScores.indexOf(Math.max(...rowScores)) + 1}, C{colScores.indexOf(Math.max(...colScores)) + 1}) →{' '}
                <strong className="text-emerald-400 text-sm">
                  {MATRIX_6X6[rowScores.indexOf(Math.max(...rowScores))][colScores.indexOf(Math.max(...colScores))]}
                </strong>
              </span>
            </div>
          </div>

          {/* Timing & Paradigm Tuning Controls */}
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                Paradigm Calibration
              </span>
              <span className="text-[10px] font-mono text-blue-400">
                DONCHIN PROTOCOL
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1 font-mono">Repetitions:</span>
                <select
                  disabled={isRunning}
                  value={repetitions}
                  onChange={(e) => setRepetitions(Number(e.target.value))}
                  className="w-full bg-[#0a0b10] border border-slate-800 text-slate-200 text-xs rounded-lg p-1.5 font-mono focus:border-blue-500"
                >
                  <option value={1}>1 Rep (Fast)</option>
                  <option value={3}>3 Reps (85%)</option>
                  <option value={5}>5 Reps (91%)</option>
                  <option value={10}>10 Reps (96%)</option>
                  <option value={15}>15 Reps (98.4%)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1 font-mono">Flash Duration:</span>
                <select
                  disabled={isRunning}
                  value={flashDurationMs}
                  onChange={(e) => setFlashDurationMs(Number(e.target.value))}
                  className="w-full bg-[#0a0b10] border border-slate-800 text-slate-200 text-xs rounded-lg p-1.5 font-mono focus:border-blue-500"
                >
                  <option value={60}>60 ms (Rapid)</option>
                  <option value={100}>100 ms (Standard)</option>
                  <option value={140}>140 ms (Clinical)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1 font-mono">ISI Gap:</span>
                <select
                  disabled={isRunning}
                  value={isiDurationMs}
                  onChange={(e) => setIsiDurationMs(Number(e.target.value))}
                  className="w-full bg-[#0a0b10] border border-slate-800 text-slate-200 text-xs rounded-lg p-1.5 font-mono focus:border-blue-500"
                >
                  <option value={50}>50 ms (Rapid)</option>
                  <option value={75}>75 ms (Standard)</option>
                  <option value={100}>100 ms (Relaxed)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
