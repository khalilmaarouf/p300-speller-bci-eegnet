# 🧠 P300 Speller ("Thought-to-Text"): Production BCI Pipeline & EEGNet Deep Learning

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![MOABB](https://img.shields.io/badge/Benchmark-MOABB_BNCI2014__008-green.svg)](http://moabb.neurotechx.com/)
[![MNE-Python](https://img.shields.io/badge/Signal_Processing-MNE--Python-orange.svg)](https://mne.tools/)
[![TensorFlow](https://img.shields.io/badge/Deep_Learning-EEGNet-yellow.svg)](https://www.tensorflow.org/)
[![Jupyter Notebook](https://img.shields.io/badge/Notebook-Google_Colab-F37626.svg)](https://colab.research.google.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_&_Vite-cyan.svg)](https://react.dev/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen.svg)](#-live-interactive-demo)

A complete, production-grade **Brain-Computer Interface (BCI)** project for thought-to-text communication using **Real 64-Channel EEG data** from the **BNCI2014_008** benchmark (BCI Competition III Dataset II). 

Designed for assistive communication for ALS and Locked-In Syndrome (LIS) patients.

---

## 🌐 Live Interactive Demo

You can experience the live interactive 6x6 Matrix P300 Speller and Real-Time ERP Topography directly in your browser:
👉 [Launch Interactive Web Interface Online](https://your-app-name.vercel.app)

---

## 🔬 Neuroscientific Foundation: The P300 Oddball Paradigm

The **P300 (P3b)** is a positive voltage deflection in the human Electroencephalogram (EEG) peaking between **250 ms and 450 ms** post-stimulus, with maximal amplitude over centroparietal electrodes (`Pz`, `Cz`).

### Farwell & Donchin 6x6 Matrix Speller
- A 6x6 grid displays 36 alphanumeric characters (`A-Z`, `1-9`, `_`).
- Rows and columns flash (intensify) randomly.
- **Target Event (Oddball)**: When the row or column containing the user's intended character flashes, the brain involuntarily fires an ERP (P300).
- **Non-Target Event (Standard)**: Flashes of other rows/columns do NOT elicit a P300.
- **Decoding**: The intersection of the highest probability row and column identifies the target character.

$$\text{Target Character} = \text{Matrix}\Big(\arg\max_{r} P(\text{Row}_r = \text{Target}), \; \arg\max_{c} P(\text{Col}_c = \text{Target})\Big)$$

---

## ⚡ Information Transfer Rate (Wolpaw ITR)

The throughput of the BCI system is mathematically measured in **Bits Per Minute (bpm)**:

$$\text{ITR} = \frac{60}{T} \left[ \log_2 N + P \log_2 P + (1 - P) \log_2 \left(\frac{1 - P}{N - 1}\right) \right]$$

- $N = 36$ (Number of possible character choices in 6x6 matrix)
- $P$ = Classification accuracy (e.g. $98.4\%$)
- $T$ = Selection time in seconds per character ($N_{\text{reps}} \times 12 \times (\text{Flash} + \text{ISI})$)

---

## 🧬 Preprocessing & EEGNet Architecture

### 1. Preprocessing Pipeline (`python/data_loader.py`)
- **Bandpass Filter**: $0.1 \text{ Hz} - 20.0 \text{ Hz}$ zero-phase Butterworth filter (removes baseline drift and high-frequency EMG/line noise).
- **Resampling**: Downsampled from $240 \text{ Hz} \to 128 \text{ Hz}$ (retaining all ERP spectral features below $20 \text{ Hz}$ while reducing parameter footprint).
- **Epoch Window**: $[0.0, 0.8] \text{ s}$ post-flash onset (103 time points).
- **Baseline Correction**: Pre-stimulus DC offset subtraction $[-0.1, 0.0] \text{ s}$.

### 2. Deep Learning Architecture (`python/model.py`)
We implement **EEGNet** (Lawhern et al., 2018), a compact convolutional neural network tailored for EEG:
- **Block 1**: Temporal 1D Convolution ($1 \times 64$) $\to$ Depthwise Spatial Convolution ($64 \times 1$) with max-norm constraint $\to$ ELU $\to$ AvgPool ($1 \times 4$) $\to$ Dropout ($0.5$).
- **Block 2**: Separable Convolution ($1 \times 16$) $\to$ ELU $\to$ AvgPool ($1 \times 8$) $\to$ Dropout ($0.5$).
- **Classification Head**: Flatten $\to$ Dense(1, Sigmoid) with balanced class weights (1:5 Target-to-NonTarget).

---

## 🚀 Quickstart Guide

### 1. Interactive React Web Application
```bash
# Install NPM dependencies
npm install

# Run Vite development server
npm run dev
```

### 2. Python ML Training & Jupyter Notebook
```bash
# Option A: Run Jupyter Notebook / Google Colab
jupyter notebook p300_speller_eegnet.ipynb

# Option B: Run Python scripts directly
cd python
pip install -r requirements.txt
python model.py
```

---

## 📊 Benchmark Results

| Model | Subject | 15 Reps Acc (%) | 5 Reps Acc (%) | AUC-ROC | Parameters |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EEGNet (Ours)** | Sub-A | **98.4%** | **91.2%** | **0.942** | **2,266** |
| **EEGNet (Ours)** | Sub-B | **96.8%** | **87.5%** | **0.931** | **2,266** |
| **FBCSP + LDA** | Sub-A | 92.1% | 81.4% | 0.884 | N/A |
| **xDAWN + SVM** | Sub-A | 94.0% | 84.6% | 0.905 | N/A |
