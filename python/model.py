"""
model.py
========
Deep Learning Classifier for P300 Speller: Compact EEGNet Architecture.
Reference: Lawhern et al., "EEGNet: a compact convolutional neural network for
EEG-based brain-computer interfaces", J. Neural Eng., 2018.

Key Architectural Elements:
1. 2D Temporal Convolution: Learns frequency band filters (1 x Fs//2).
2. Depthwise Spatial Convolution: Learns spatial topography filters across all channels.
3. Separable Convolution: Decouples temporal and spatial feature aggregation.
4. Class-Weight Balancing: Mitigates 5:1 Oddball NonTarget-to-Target skew.
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, Conv2D, DepthwiseConv2D, SeparableConv2D,
    BatchNormalization, Activation, AveragePooling2D,
    Dropout, Flatten, Dense
)
from tensorflow.keras.constraints import max_norm
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, roc_auc_score
from typing import Tuple, Any


def build_eegnet(
    n_classes: int = 2,
    channels: int = 64,
    samples: int = 103,
    dropout_rate: float = 0.5,
    kern_length: int = 64,
    F1: int = 8,
    D: int = 2,
    F2: int = 16,
    norm_rate: float = 0.25
) -> Model:
    """
    Constructs the EEGNet Keras Model.

    Parameters
    ----------
    n_classes : int
        Number of output classes (2 for Binary P300: Target vs Non-Target).
    channels : int
        Number of EEG electrodes (e.g., 64).
    samples : int
        Time points per epoch (e.g., 103 samples for 800ms @ 128Hz).
    dropout_rate : float
        Dropout probability for regularization.
    kern_length : int
        Length of initial temporal convolution kernel (half of sampling rate).
    F1 : int
        Number of temporal filters.
    D : int
        Depth multiplier (spatial filters per temporal filter).
    F2 : int
        Number of pointwise filters (F1 * D = 16).
    norm_rate : float
        Maximum norm constraint for weights.

    Returns
    -------
    tf.keras.Model
        Compiled EEGNet model.
    """
    input_tensor = Input(shape=(channels, samples, 1), name="eeg_input")

    # ----------------------------------------------------
    # BLOCK 1: Temporal Filtering + Depthwise Spatial Conv
    # ----------------------------------------------------
    # Step 1: 1D Temporal Convolution across time axis
    x = Conv2D(
        filters=F1,
        kernel_size=(1, kern_length),
        padding='same',
        use_bias=False,
        name="temporal_conv"
    )(input_tensor)
    x = BatchNormalization(name="temporal_bn")(x)

    # Step 2: Depthwise Spatial Convolution across all electrodes
    x = DepthwiseConv2D(
        kernel_size=(channels, 1),
        use_bias=False,
        depth_multiplier=D,
        depthwise_constraint=max_norm(1.0),
        name="spatial_depthwise_conv"
    )(x)
    x = BatchNormalization(name="spatial_bn")(x)
    x = Activation('elu', name="elu_1")(x)
    x = AveragePooling2D(pool_size=(1, 4), name="avg_pool_1")(x)
    x = Dropout(dropout_rate, name="dropout_1")(x)

    # ----------------------------------------------------
    # BLOCK 2: Separable Convolution (Temporal + Pointwise)
    # ----------------------------------------------------
    x = SeparableConv2D(
        filters=F2,
        kernel_size=(1, 16),
        padding='same',
        use_bias=False,
        name="separable_conv"
    )(x)
    x = BatchNormalization(name="separable_bn")(x)
    x = Activation('elu', name="elu_2")(x)
    x = AveragePooling2D(pool_size=(1, 8), name="avg_pool_2")(x)
    x = Dropout(dropout_rate, name="dropout_2")(x)

    # ----------------------------------------------------
    # CLASSIFICATION HEAD
    # ----------------------------------------------------
    x = Flatten(name="flatten")(x)
    
    if n_classes == 2:
        output_tensor = Dense(
            1,
            activation='sigmoid',
            kernel_constraint=max_norm(norm_rate),
            name="p300_output"
        )(x)
        loss = 'binary_crossentropy'
    else:
        output_tensor = Dense(
            n_classes,
            activation='softmax',
            kernel_constraint=max_norm(norm_rate),
            name="p300_output"
        )(x)
        loss = 'categorical_crossentropy'

    model = Model(inputs=input_tensor, outputs=output_tensor, name="EEGNet_P300")
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss=loss,
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )
    return model


def train_eegnet(
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_val: np.ndarray,
    y_val: np.ndarray,
    epochs: int = 80,
    batch_size: int = 64
) -> Tuple[Model, Any]:
    """
    Trains EEGNet with class weight re-balancing and checkpointing.
    """
    # Calculate balanced class weights (10 non-targets for every 2 targets)
    classes = np.unique(y_train)
    weights = compute_class_weight(class_weight='balanced', classes=classes, y=y_train)
    class_weight_dict = {int(c): float(w) for c, w in zip(classes, weights)}
    print(f"[Class Weights] {class_weight_dict}")

    model = build_eegnet(
        channels=X_train.shape[1],
        samples=X_train.shape[2]
    )
    model.summary()

    callbacks = [
        ModelCheckpoint('best_eegnet_weights.keras', monitor='val_auc', mode='max', save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_auc', mode='max', patience=15, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-5)
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    return model, history


if __name__ == '__main__':
    from data_loader import load_and_preprocess_p300_data
    dataset = load_and_preprocess_p300_data(subject_id=1)
    model, hist = train_eegnet(
        dataset['X_train'], dataset['y_train'],
        dataset['X_val'], dataset['y_val']
    )
    preds = model.predict(dataset['X_test'])
    print("Test AUC:", roc_auc_score(dataset['y_test'], preds))
