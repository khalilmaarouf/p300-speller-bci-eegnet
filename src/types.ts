export interface EEGChannel {
  id: string;
  name: string;
  x: number; // Normalized 2D scalp coordinate [-1, 1]
  y: number;
  impedance: number; // in kOhms (e.g., 2.1)
  region: 'frontal' | 'central' | 'parietal' | 'occipital' | 'temporal';
}

export interface ERPDataPoint {
  timeMs: number;
  targetUv: number;
  targetStdErr: number;
  nonTargetUv: number;
  nonTargetStdErr: number;
  differenceUv: number;
}

export interface SubjectProfile {
  id: string;
  name: string;
  dataset: string;
  gender: string;
  age: number;
  condition: 'Healthy Control' | 'ALS Patient (Early)' | 'ALS Patient (Advanced)';
  accuracy15Reps: number;
  accuracy5Reps: number;
  accuracy1Rep: number;
  p300PeakLatencyMs: number;
  p300PeakAmplitudeUv: number;
  itrBitsPerMin: number;
}

export interface FlashEvent {
  type: 'row' | 'col';
  index: number; // 0-5
  timestamp: number;
  isTarget: boolean;
}

export interface TrialState {
  targetWord: string;
  currentLetterIndex: number;
  currentFlashIndex: number;
  repetitionCount: number;
  totalRepetitions: number; // e.g. 5 or 10 or 15
  isFlashing: boolean;
  activeRow: number | null;
  activeCol: number | null;
  accumulatedRowScores: number[]; // length 6
  accumulatedColScores: number[]; // length 6
  decodedLetters: string[];
  confidenceScores: number[];
  flashHistory: FlashEvent[];
}

export interface EEGNetMetrics {
  accuracy: number;
  aucRoc: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  epochs: number;
  parametersCount: number;
}

export interface CodeDeliverable {
  filename: string;
  language: string;
  description: string;
  code: string;
}
