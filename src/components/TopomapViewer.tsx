import React, { useState, useMemo } from 'react';
import { Layers, Play, Pause, RotateCcw, Info, Sparkles } from 'lucide-react';
import { STANDARD_CHANNELS, getERPWaveformForChannel } from '../data/bciDataset';
import { SubjectProfile } from '../types';

interface TopomapViewerProps {
  subject: SubjectProfile;
}

export const TopomapViewer: React.FC<TopomapViewerProps> = ({ subject }) => {
  const [latencyMs, setLatencyMs] = useState<number>(312); // default to P300 peak
  const [selectedElectrode, setSelectedElectrode] = useState<string>('Pz');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Compute voltage for all electrodes at current latency
  const electrodeVoltages = useMemo(() => {
    const voltages: Record<string, number> = {};
    STANDARD_CHANNELS.forEach((ch) => {
      const waveform = getERPWaveformForChannel(ch.name, subject.id);
      // find closest time point
      const pt = waveform.reduce((prev, curr) =>
        Math.abs(curr.timeMs - latencyMs) < Math.abs(prev.timeMs - latencyMs) ? curr : prev
      );
      voltages[ch.name] = pt.targetUv;
    });
    return voltages;
  }, [latencyMs, subject.id]);

  // Color mapper from voltage (-4 μV to +9 μV) to RGB gradient
  const getVoltageColor = (uV: number) => {
    // Normal range: -3 (blue) to 0 (slate) to +8.5 (emerald/cyan/yellow)
    if (uV >= 0) {
      const ratio = Math.min(1, uV / 8.5);
      if (ratio > 0.7) {
        return `rgba(245, 158, 11, ${0.4 + ratio * 0.6})`; // bright amber/yellow for peak P300
      }
      return `rgba(16, 185, 129, ${0.3 + ratio * 0.7})`; // emerald/green
    } else {
      const ratio = Math.min(1, Math.abs(uV) / 3.5);
      return `rgba(59, 130, 246, ${0.3 + ratio * 0.7})`; // blue for negative
    }
  };

  // Play animation through 0-800ms
  React.useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setLatencyMs((prev) => {
          if (prev >= 780) {
            setIsPlaying(false);
            return 800;
          }
          return prev + 15;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-light text-white tracking-tight">
              2D Scalp Topography <span className="font-bold text-blue-500">(10-20 System)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Centroparietal cortical dipole dynamics across the 64-channel ActiCAP montage during target P300 stimulation.
          </p>
        </div>

        {/* Latency Quick Jump Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: 'P100 (110ms)', time: 110 },
            { label: 'N200 (205ms)', time: 205 },
            { label: 'P300 Peak (312ms)', time: subject.p300PeakLatencyMs },
            { label: 'Late Wave (550ms)', time: 550 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setLatencyMs(preset.time);
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                Math.abs(latencyMs - preset.time) < 15
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-semibold shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Topo Canvas & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scalp Map 2D View */}
        <div className="lg:col-span-7 bg-[#0d0f16] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative">
          {/* Time Slider & Play Controls */}
          <div className="w-full flex items-center justify-between gap-4 mb-4 bg-[#0a0b10] p-3 rounded-xl border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 hover:bg-blue-600/30 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-blue-400" />}
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase tracking-wider font-semibold">Time Post-Flash:</span>
                <span className="text-blue-400 font-bold">{latencyMs} ms</span>
              </div>
              <input
                type="range"
                min={0}
                max={800}
                step={8}
                value={latencyMs}
                onChange={(e) => {
                  setLatencyMs(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <button
              onClick={() => {
                setLatencyMs(0);
                setIsPlaying(false);
              }}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Scalp Head Circle Graphic */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center my-4">
            {/* Outer Head Contour */}
            <div className="absolute inset-0 rounded-full border-2 border-slate-700 bg-[#0a0b10] shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Nose triangle */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 border-t-2 border-l-2 border-slate-600 bg-[#0a0b10]" />
              
              {/* Left ear */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full border border-slate-600 bg-[#0a0b10]" />
              {/* Right ear */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full border border-slate-600 bg-[#0a0b10]" />

              {/* Interpolated Topo Heatmap Blobs */}
              <div
                className="absolute w-44 h-44 rounded-full blur-2xl opacity-75 transition-all duration-150 pointer-events-none"
                style={{
                  top: '55%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: getVoltageColor(electrodeVoltages['Pz'] || 0),
                }}
              />
              <div
                className="absolute w-36 h-36 rounded-full blur-xl opacity-60 transition-all duration-150 pointer-events-none"
                style={{
                  top: '35%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: getVoltageColor(electrodeVoltages['Cz'] || 0),
                }}
              />
              <div
                className="absolute w-28 h-28 rounded-full blur-lg opacity-50 transition-all duration-150 pointer-events-none"
                style={{
                  top: '80%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: getVoltageColor(electrodeVoltages['Oz'] || 0),
                }}
              />

              {/* Central axes */}
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-800/60" />
              <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-800/60" />

              {/* Electrodes (10-20 System) */}
              {STANDARD_CHANNELS.map((ch) => {
                const uV = electrodeVoltages[ch.name] ?? 0;
                const isSelected = selectedElectrode === ch.name;
                // Map x [-1, 1] and y [-1, 1] to CSS percentage
                // In scalp topomap, +y is anterior (top), -y is posterior (bottom)
                const leftPercent = 50 + ch.x * 40;
                const topPercent = 50 - ch.y * 40;

                return (
                  <button
                    key={ch.id}
                    id={`electrode-${ch.id}`}
                    onClick={() => setSelectedElectrode(ch.name)}
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: getVoltageColor(uV),
                    }}
                    className={`absolute w-8 h-8 rounded-full flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all shadow-md cursor-pointer ${
                      isSelected
                        ? 'ring-4 ring-blue-400 scale-125 z-30 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        : 'border border-slate-900 text-slate-100 hover:scale-110 z-10'
                    }`}
                  >
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colorbar scale */}
          <div className="w-full max-w-sm flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2">
            <span className="text-blue-400">-3.5 μV (Inhibition)</span>
            <div className="flex-1 mx-3 h-2 rounded-full bg-gradient-to-r from-blue-500 via-slate-800 to-amber-400 border border-slate-700" />
            <span className="text-amber-400">+8.5 μV (P300 Peak)</span>
          </div>
        </div>

        {/* Right: Selected Electrode Detailed Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Selected Electrode</span>
                <h3 className="text-xl font-bold font-mono text-white">
                  Channel {selectedElectrode}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                10-20 Standard
              </span>
            </div>

            <div className="space-y-3 bg-[#0a0b10] p-4 rounded-xl border border-slate-800/80 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Instantaneous Voltage (t={latencyMs}ms):</span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {electrodeVoltages[selectedElectrode] > 0 ? `+` : ''}
                  {electrodeVoltages[selectedElectrode]?.toFixed(2)} μV
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Cortical Region:</span>
                <span className="font-semibold text-slate-200 capitalize">
                  {STANDARD_CHANNELS.find((c) => c.name === selectedElectrode)?.region || 'Scalp'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                <span className="text-slate-400">Electrode Impedance:</span>
                <span className="font-mono text-slate-200">
                  {STANDARD_CHANNELS.find((c) => c.name === selectedElectrode)?.impedance} kΩ
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Role in P300 Speller:</span>
                <span className="text-blue-400 font-medium text-right max-w-[180px]">
                  {selectedElectrode === 'Pz'
                    ? 'Primary P3b Centroparietal oddball feature node.'
                    : selectedElectrode === 'Cz'
                    ? 'Vertex sensory & attention reference node.'
                    : selectedElectrode === 'Oz'
                    ? 'Early visual P100 luminance detection.'
                    : selectedElectrode.startsWith('F')
                    ? 'Frontal attentional orientation (N200).'
                    : 'Spatial EEGNet feature aggregator.'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              P300 Spatial Topography Principles
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The P300 component originates primarily from the <strong>temporo-parietal junction</strong> and <strong>cingulate cortex</strong>. On a 2D scalp topomap, this produces a strong positive dipole focus directly over <strong>Pz</strong>, <strong>P3</strong>, and <strong>P4</strong> between 280ms and 360ms post-flash.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
