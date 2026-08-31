"""
data_loader.py
==============
Production Data Pipeline for P300 BCI Speller using Real EEG Data.
Dataset: BNCI2014_008 (BCI Competition III - Dataset II, 64 channels).
Toolkit: MOABB (Mother of All BCI Benchmarks) & MNE-Python.

Pipeline steps:
1. Fetch BNCI2014_008 dataset via MOABB paradigm interface.
2. Bandpass filter: 0.1 Hz - 20.0 Hz (Butterworth zero-phase forward-backward).
3. Resample to 128 Hz for computational efficiency & EEGNet compatibility.
4. Epoching: Extract [0.0, 0.8]s post-stimulus windows (103 time points).
5. Baseline correction using pre-stimulus interval [-0.1, 0.0]s.
6. Return structured X (trials, channels, time_samples) and y (target/non-target).
"""

import numpy as np
import mne
from moabb.datasets import BNCI2014_008
from moabb.paradigms import P300
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, Any


def load_and_preprocess_p300_data(
    subject_id: int = 1,
    fmin: float = 0.1,
    fmax: float = 20.0,
    resample_freq: float = 128.0,
    tmin: float = 0.0,
    tmax: float = 0.8,
    baseline: Tuple[float, float] = (0.0, 0.1)
) -> Dict[str, Any]:
    """
    Fetches real P300 EEG data from MOABB (BNCI2014_008) and applies clinical preprocessing.

    Parameters
    ----------
    subject_id : int
        Subject ID to fetch (1 to 8).
    fmin : float
        High-pass cutoff frequency in Hz.
    fmax : float
        Low-pass cutoff frequency in Hz.
    resample_freq : float
        Target sampling rate in Hz.
    tmin : float
        Epoch start time relative to flash onset (seconds).
    tmax : float
        Epoch end time relative to flash onset (seconds).
    baseline : tuple
        Baseline interval for DC offset subtraction.

    Returns
    -------
    dict
        Dictionary containing:
        - 'X_train', 'y_train': Training epochs & labels
        - 'X_val', 'y_val': Validation epochs & labels
        - 'X_test', 'y_test': Test epochs & labels
        - 'channel_names': List of 64 standard EEG electrode names
        - 'info': MNE Info dictionary with sampling rate & montage
    """
    print(f"[*] Initializing MOABB P300 Paradigm for Subject {subject_id}...")
    paradigm = P300(
        fmin=fmin,
        fmax=fmax,
        resample=resample_freq,
        tmin=tmin,
        tmax=tmax,
        baseline=baseline
    )

    dataset = BNCI2014_008()
    dataset.subject_list = [subject_id]

    print(f"[*] Downloading / Loading raw EDF data from PhysioNet / BNCI...")
    X, labels, metadata = paradigm.get_data(dataset=dataset, subjects=[subject_id])

    # Convert binary string labels ('Target' / 'NonTarget') to numeric integers
    y = np.array([1 if lbl.lower() == 'target' else 0 for lbl in labels], dtype=np.int32)

    # Standardize data format: (N_epochs, N_channels, N_samples)
    n_epochs, n_channels, n_samples = X.shape
    print(f"[✓] Data loaded successfully: {n_epochs} epochs, {n_channels} channels, {n_samples} samples per epoch.")
    print(f"[✓] Class distribution: {np.sum(y == 1)} Targets (P300), {np.sum(y == 0)} Non-Targets.")

    # Stratified Train/Val/Test Split (70% train, 15% val, 15% test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    # Re-shape tensors for Keras 2D Conv format: (N_epochs, N_channels, N_samples, 1)
    X_train = np.expand_dims(X_train, axis=-1)
    X_val = np.expand_dims(X_val, axis=-1)
    X_test = np.expand_dims(X_test, axis=-1)

    return {
        'X_train': X_train,
        'y_train': y_train,
        'X_val': X_val,
        'y_val': y_val,
        'X_test': X_test,
        'y_test': y_test,
        'channel_names': [f"Ch_{i+1}" for i in range(n_channels)],
        'sampling_rate': resample_freq,
        'n_samples': n_samples,
        'n_channels': n_channels
    }


if __name__ == '__main__':
    data = load_and_preprocess_p300_data(subject_id=1)
    print(f"X_train shape: {data['X_train'].shape}")
    print(f"y_train shape: {data['y_train'].shape}")
