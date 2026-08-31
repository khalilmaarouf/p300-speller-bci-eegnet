import { MATRIX_6X6 } from '../data/bciDataset';

export interface InferenceResult {
  rowProbabilities: number[];
  colProbabilities: number[];
  bestRow: number;
  bestCol: number;
  predictedChar: string;
  confidence: number;
  snrDb: number;
  eegTraces: number[][]; // 4 key channels (Pz, Cz, Fz, Oz) 103 samples
}

/**
 * Simulates a realistic single-character P300 epoch sequence through EEGNet
 */
export function runEEGNetCharacterInference(
  targetChar: string,
  repetitions: number,
  subjectAccuracy: number = 98.4,
  p300LatencyMs: number = 312
): InferenceResult {
  let targetRow = 0;
  let targetCol = 0;

  // Find target coordinates in matrix
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (MATRIX_6X6[r][c] === targetChar) {
        targetRow = r;
        targetCol = c;
        break;
      }
    }
  }

  const rowScores = [0, 0, 0, 0, 0, 0];
  const colScores = [0, 0, 0, 0, 0, 0];

  // Base accuracy factor based on subject calibration and repetitions
  const noiseFactor = Math.max(0.04, 0.25 - (repetitions * 0.015));

  for (let rep = 0; rep < repetitions; rep++) {
    for (let r = 0; r < 6; r++) {
      const isTarget = r === targetRow;
      const baseProb = isTarget ? 0.84 : 0.16;
      const noise = (Math.random() - 0.5) * noiseFactor * 2;
      rowScores[r] += Math.max(0.01, Math.min(0.99, baseProb + noise));
    }
    for (let c = 0; c < 6; c++) {
      const isTarget = c === targetCol;
      const baseProb = isTarget ? 0.84 : 0.16;
      const noise = (Math.random() - 0.5) * noiseFactor * 2;
      colScores[c] += Math.max(0.01, Math.min(0.99, baseProb + noise));
    }
  }

  // Normalize scores
  const maxRowScore = Math.max(...rowScores);
  const maxColScore = Math.max(...colScores);
  const bestRow = rowScores.indexOf(maxRowScore);
  const bestCol = colScores.indexOf(maxColScore);

  const predictedChar = MATRIX_6X6[bestRow][bestCol];
  
  // Calculate soft confidence
  const normRowScores = rowScores.map(s => s / (repetitions || 1));
  const normColScores = colScores.map(s => s / (repetitions || 1));
  const rowMargin = normRowScores[bestRow] - (normRowScores.filter((_, i) => i !== bestRow).reduce((a, b) => a + b, 0) / 5);
  const colMargin = normColScores[bestCol] - (normColScores.filter((_, i) => i !== bestCol).reduce((a, b) => a + b, 0) / 5);
  const confidence = Math.min(99.4, Math.max(65.0, Math.round(((rowMargin + colMargin) / 1.4) * 100)));

  // Generate synthetic representative EEG streaming traces (103 samples)
  const eegTraces: number[][] = [];
  const channels = ['Pz', 'Cz', 'Fz', 'Oz'];
  for (let ch = 0; ch < 4; ch++) {
    const trace: number[] = [];
    const ampMult = ch === 0 ? 8.5 : ch === 1 ? 7.2 : ch === 2 ? 4.8 : 3.0;
    for (let i = 0; i < 103; i++) {
      const t = (i / 102) * 800;
      const p300 = ampMult * Math.exp(-Math.pow((t - p300LatencyMs) / 75, 2));
      const n200 = -2.2 * Math.exp(-Math.pow((t - 200) / 45, 2));
      const noise = (Math.random() - 0.5) * 1.8;
      trace.push(parseFloat((p300 + n200 + noise).toFixed(2)));
    }
    eegTraces.push(trace);
  }

  return {
    rowProbabilities: normRowScores.map(v => parseFloat(v.toFixed(3))),
    colProbabilities: normColScores.map(v => parseFloat(v.toFixed(3))),
    bestRow,
    bestCol,
    predictedChar,
    confidence,
    snrDb: parseFloat((8.4 + (repetitions * 0.8) + (Math.random() * 0.5)).toFixed(1)),
    eegTraces
  };
}

/**
 * Text-To-Speech Synthesis helper for ALS assistive communication
 */
export function speakText(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Play a subtle neurofeedback auditory click on flash or target detection
 */
export function playBeep(frequency: number = 880, durationMs: number = 40) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // ignore audio block
  }
}
