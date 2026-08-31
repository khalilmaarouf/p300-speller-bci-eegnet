import React, { useState } from 'react';
import { Brain, Cpu, Database, Award, CheckCircle2, Sliders, Layers, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { EEGNET_TRAINED_METRICS, ROC_CURVE_DATA } from '../data/bciDataset';

export const ModelArchitecture: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number>(0);

  const layers = [
    {
      id: 0,
      name: 'Input Layer',
      shape: '(64, 103, 1)',
      type: 'EEG Epoch Tensor',
      desc: '64 EEG electrodes (10-20 layout) across 103 time points (800ms window @ 128Hz).',
      params: 0,
    },
    {
      id: 1,
      name: 'Temporal Conv2D (1 x 64)',
      shape: '(64, 103, 8)',
      type: '1D Temporal Filtering',
      desc: 'Learns F1=8 frequency bandpass filters in the time domain at half sampling rate (64 points = 500ms receptive field).',
      params: 512,
    },
    {
      id: 2,
      name: 'Spatial DepthwiseConv2D (64 x 1)',
      shape: '(1, 103, 16)',
      type: 'Spatial Scalp Topography',
      desc: 'Applies D=2 spatial filters across all 64 channels per temporal feature map, learning optimal scalp electrode weights (Pz, Cz, Oz).',
      params: 1024,
    },
    {
      id: 3,
      name: 'ELU + AvgPool (1 x 4) + Dropout',
      shape: '(1, 25, 16)',
      type: 'Activation & Subsampling',
      desc: 'Non-linear ELU activation followed by temporal subsampling to 32Hz and 50% dropout for regularization against EEG noise.',
      params: 32,
    },
    {
      id: 4,
      name: 'Separable Conv2D (1 x 16)',
      shape: '(1, 25, 16)',
      type: 'Pointwise & Depthwise Decoupling',
      desc: 'Decouples temporal summary from cross-feature combinations (F2=16 pointwise filters), compressing spatial-temporal representations.',
      params: 528,
    },
    {
      id: 5,
      name: 'ELU + AvgPool (1 x 8) + Dropout',
      shape: '(1, 3, 16)',
      type: 'Subsampling to Feature Vector',
      desc: 'Subsamples temporal resolution to ~4Hz, yielding a condensed 48-dimensional feature embedding.',
      params: 32,
    },
    {
      id: 6,
      name: 'Dense Classification Head',
      shape: '(1,)',
      type: 'Sigmoid Probability P(P300)',
      desc: 'Dense sigmoid output with max-norm constraint (norm_rate=0.25) predicting P300 Oddball Target probability with class-balanced cross-entropy.',
      params: 49,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-light text-white tracking-tight">
              EEGNet Deep Learning <span className="font-bold text-blue-500">Architecture</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Compact Convolutional Neural Network optimized specifically for Electroencephalography and BCI Spellers.
          </p>
        </div>

        {/* Quick model badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
            EEGNet-8,2 (F1=8, D=2, F2=16)
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0d0f16] border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">AUC-ROC Metric</span>
          <span className="text-2xl font-mono font-bold text-emerald-400">
            {EEGNET_TRAINED_METRICS.aucRoc}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Oddball Discrimination</span>
        </div>

        <div className="bg-[#0d0f16] border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Trainable Parameters</span>
          <span className="text-2xl font-mono font-bold text-blue-400">
            {EEGNET_TRAINED_METRICS.parametersCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block font-mono">Ultra-Compact (Edge Ready)</span>
        </div>

        <div className="bg-[#0d0f16] border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">15-Rep Accuracy</span>
          <span className="text-2xl font-mono font-bold text-amber-400">98.4%</span>
          <span className="text-[10px] text-slate-500 block font-mono">BCI Comp III Benchmark</span>
        </div>

        <div className="bg-[#0d0f16] border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">Inference Time</span>
          <span className="text-2xl font-mono font-bold text-purple-400">1.4 ms</span>
          <span className="text-[10px] text-slate-500 block font-mono">Zero Latency Overhead</span>
        </div>
      </div>

      {/* Interactive Layer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Blocks */}
        <div className="lg:col-span-6 bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Layer-by-Layer Computational Graph
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Click layer to inspect</span>
          </div>

          <div className="space-y-2">
            {layers.map((layer) => {
              const isSelected = selectedLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                      : 'bg-[#0a0b10] text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {layer.id}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold font-mono text-white">{layer.name}</h4>
                      <span className="text-[10px] text-slate-500">{layer.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-semibold text-emerald-400 block">
                      {layer.shape}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{layer.params} params</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Layer Inspector & ROC Curve */}
        <div className="lg:col-span-6 space-y-4">
          {/* Layer Detail Card */}
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500">Selected Layer Specification</span>
              <span className="text-xs font-mono text-blue-400 font-bold">
                Output: {layers[selectedLayer].shape}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100 font-mono">
              {layers[selectedLayer].name}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {layers[selectedLayer].desc}
            </p>

            <div className="p-3 bg-[#0a0b10] rounded-xl border border-slate-800 text-xs space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Operation Class:</span>
                <span className="text-slate-200">{layers[selectedLayer].type}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Weight Parameters:</span>
                <span className="text-emerald-400">{layers[selectedLayer].params} weights</span>
              </div>
            </div>
          </div>

          {/* ROC Curve Chart */}
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Discriminative Power</span>
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
                  ROC Curve (AUC = 0.942)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                P300 vs Non-Target
              </span>
            </div>

            <div className="w-full h-44 bg-[#0a0b10] p-2 rounded-xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ROC_CURVE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="fpr" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} unit=" FPR" />
                  <YAxis dataKey="tpr" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} unit=" TPR" domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d0f16',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      color: '#e2e8f0',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Area type="monotone" dataKey="tpr" stroke="#10b981" fill="rgba(16, 185, 129, 0.2)" strokeWidth={2} />
                  <Line type="monotone" dataKey="fpr" stroke="#475569" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Confusion Matrix Mini Grid */}
            <div className="pt-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5 font-semibold">
                Target vs Non-Target Confusion Matrix (Balanced Test Set)
              </span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">True Target (TP)</span>
                  <span className="text-emerald-400 font-bold text-sm">90.7%</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">False Alarm (FP)</span>
                  <span className="text-rose-400 font-bold text-sm">7.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
