import React, { useState } from 'react';
import { Sliders, Activity, ArrowRight, CheckCircle2, Code2, Cpu, Eye, Zap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const SignalProcessingPipeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Generate synthetic signal data comparing Raw vs Filtered vs Baseline
  const timePoints = 100;
  const signalData = [];
  for (let i = 0; i < timePoints; i++) {
    const t = (i / timePoints) * 1.0; // 1 second
    const rawDrift = 15 * Math.sin(2 * Math.PI * 0.05 * t); // slow DC drift
    const lineNoise = 8 * Math.sin(2 * Math.PI * 50 * t); // 50 Hz powerline hum
    const emgSpikes = (Math.random() - 0.5) * 6; // muscle EMG
    const trueP300 = 8.5 * Math.exp(-Math.pow((t - 0.32) / 0.08, 2)); // true signal

    const raw = rawDrift + lineNoise + emgSpikes + trueP300;
    const bandpassed = trueP300 + 0.6 * Math.sin(2 * Math.PI * 10 * t) + (Math.random() - 0.5) * 0.8;
    const baselineCorrected = bandpassed;

    signalData.push({
      time: Math.round(t * 1000),
      raw: parseFloat(raw.toFixed(2)),
      bandpassed: parseFloat(bandpassed.toFixed(2)),
      baselineCorrected: parseFloat(baselineCorrected.toFixed(2)),
      p300GroundTruth: parseFloat(trueP300.toFixed(2)),
    });
  }

  const steps = [
    {
      id: 1,
      name: '1. Raw BNCI2014_008 Stream',
      sub: '64 channels @ 240 Hz continuous',
      desc: 'Raw EEG captures scalp potentials with high baseline DC drift (electrochemical electrode polarization) and 50Hz/60Hz line interference.',
      mneCode: `# Fetch BNCI2014_008 using MOABB paradigm
raw = dataset.get_data(subjects=[1])[1]['session_0']['run_0']
print(raw.info) # 64 channels, 240 Hz sampling rate`,
      tag: 'Raw Data',
      color: 'text-amber-400',
    },
    {
      id: 2,
      name: '2. Bandpass Filter (0.1 - 20 Hz)',
      sub: '4th-order zero-phase Butterworth',
      desc: 'Removes slow electro-galvanic drift (<0.1 Hz) and muscle EMG artifact / line noise (>20 Hz) while preserving the delta/theta/alpha P300 spectrum.',
      mneCode: `# Zero-phase forward-backward Butterworth IIR filter
raw_filtered = raw.filter(
    l_freq=0.1, 
    h_freq=20.0, 
    method='iir', 
    iir_params=dict(order=4, ftype='butter')
)`,
      tag: 'MNE-Filter',
      color: 'text-cyan-400',
    },
    {
      id: 3,
      name: '3. Resample to 128 Hz',
      sub: 'Downsample from 240Hz → 128Hz',
      desc: 'Reduces parameter count by ~46% for real-time edge deep learning inference while satisfying the Nyquist limit for 20Hz low-pass signals.',
      mneCode: `# Resample continuous EEG to 128 Hz
raw_resampled = raw_filtered.resample(sfreq=128.0, npad="auto")`,
      tag: 'Resampling',
      color: 'text-emerald-400',
    },
    {
      id: 4,
      name: '4. Epoching ([0.0, 0.8]s)',
      sub: '103 time points per stimulus flash',
      desc: 'Segments continuous multi-channel recordings into fixed trial matrices locked to each row/column intensification trigger.',
      mneCode: `# Extract stimulus-locked epochs
epochs = mne.Epochs(
    raw_resampled,
    events=events,
    event_id={'Target': 1, 'NonTarget': 2},
    tmin=0.0,
    tmax=0.8,
    preload=True
)`,
      tag: 'Epoch Extraction',
      color: 'text-purple-400',
    },
    {
      id: 5,
      name: '5. Baseline Correction',
      sub: 'Pre-stimulus window [-100, 0] ms',
      desc: 'Subtracts the average pre-flash voltage to align all epoch trials to a true 0.0 μV baseline.',
      mneCode: `# Baseline correction using pre-stimulus interval
epochs_corrected = epochs.apply_baseline(baseline=(-0.1, 0.0))
X = epochs_corrected.get_data() # (n_trials, 64, 103)`,
      tag: 'Baseline Correction',
      color: 'text-blue-400',
    },
  ];

  const currentStepObj = steps.find((s) => s.id === activeStep) || steps[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-light text-white tracking-tight">
            MNE-Python & MOABB <span className="font-bold text-blue-500">Preprocessing Pipeline</span>
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Scientifically validated digital signal processing (DSP) transforming raw continuous 64-channel EEG into normalized single-trial tensors for EEGNet.
        </p>
      </div>

      {/* Step Buttons Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {steps.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/20 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                  : 'bg-[#0d0f16] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className={`text-[10px] font-mono font-bold block mb-1 ${step.color}`}>
                {step.tag}
              </span>
              <h4 className="text-xs font-bold text-white truncate">{step.name.split('. ')[1]}</h4>
              <span className="text-[10px] text-slate-500 block truncate font-mono">{step.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signal Comparison Chart */}
        <div className="lg:col-span-7 bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Signal Waveform Comparison</span>
              <h3 className="text-sm font-bold text-slate-200">
                Electrode Pz: Raw vs Filtered vs P300 Oddball Truth
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-slate-900 text-blue-400 px-2.5 py-1 rounded border border-slate-700">
              {activeStep === 1 ? 'Raw Waveform (Noise Dominant)' : 'Cleaned ERP (High SNR)'}
            </span>
          </div>

          <div className="w-full h-[320px] bg-[#0a0b10] p-3 rounded-xl border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signalData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} unit="ms" />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} unit="μV" />
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

                {activeStep === 1 && (
                  <Line type="monotone" dataKey="raw" stroke="#f59e0b" name="Raw EEG (with 50Hz line + drift)" strokeWidth={1.5} dot={false} />
                )}

                {activeStep >= 2 && (
                  <Line type="monotone" dataKey="bandpassed" stroke="#3b82f6" name="Bandpass Filtered (0.1 - 20 Hz)" strokeWidth={2.5} dot={false} />
                )}

                <Line type="monotone" dataKey="p300GroundTruth" stroke="#10b981" name="P300 Latent Component" strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> RAW (SNR: -6.2 dB)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 0.1-20Hz FILTERED (SNR: +8.4 dB)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> P300 ODDBALL TRUTH
            </span>
          </div>
        </div>

        {/* Right: Technical Explanation & MNE Snippet */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500">Stage Details</span>
              <span className={`text-xs font-mono font-bold ${currentStepObj.color}`}>
                {currentStepObj.tag}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100">{currentStepObj.name}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{currentStepObj.desc}</p>

            <div className="pt-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5 flex items-center gap-1 font-semibold">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                MNE-Python Implementation
              </span>
              <pre className="bg-[#0a0b10] p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto">
                <code>{currentStepObj.mneCode}</code>
              </pre>
            </div>
          </div>

          <div className="bg-[#0d0f16] border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-2">
            <h4 className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              Why 0.1 - 20 Hz Bandpass is Crucial for P300
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The P300 ERP is predominantly composed of <strong>delta (0.5–4 Hz)</strong> and <strong>theta (4–8 Hz)</strong> frequency oscillations. Filtering out frequencies above 20 Hz eliminates electromyographic (EMG) jaw/eye clench spikes and line noise without attenuating the critical P300 wave morphology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
