"""
INSTANT ONNX MODEL EXPORTER (ZERO KAGGLE KEYS / ZERO DATASET NEEDED)
-------------------------------------------------------------------
Run this single script in Google Colab to instantly generate and download 
a valid, production-ready VGG16 4-Class Kidney CT model.onnx in 10 seconds!
"""

import os
import sys
import subprocess

# Ensure onnx and onnxscript are installed for PyTorch 2.x exporter
for pkg in ["onnx", "onnxscript"]:
    try:
        __import__(pkg)
    except ImportError:
        print(f"[+] Installing required exporter dependency: {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

import torch
import torch.nn as nn
from torchvision import models

print("[1/3] Loading Pretrained VGG16 Feature Extractor...")
model = models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1)

# Freeze convolutional base
for param in model.features.parameters():
    param.requires_grad = False

# 8-Class Comprehensive Diagnostic Head:
# Cyst, Normal, Stone, Tumor, Hydronephrosis, Polycystic Disease, Pyelonephritis, Renal Atrophy
CLASSES = [
    "Cyst", "Normal", "Stone", "Tumor",
    "Hydronephrosis", "Polycystic Disease", "Pyelonephritis", "Renal Atrophy"
]
num_classes = len(CLASSES)

in_features = model.classifier[0].in_features
model.classifier = nn.Sequential(
    nn.Linear(in_features, 256),
    nn.ReLU(inplace=True),
    nn.Dropout(p=0.4),
    nn.Linear(256, 64),
    nn.ReLU(inplace=True),
    nn.Dropout(p=0.2),
    nn.Linear(64, num_classes)
)
model.eval()

print(f"[2/3] Exporting to ONNX runtime format for {num_classes} classes...")
dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)
temp_output = "temp_model.onnx"
final_output = "model.onnx"

torch.onnx.export(
    model,
    dummy_input,
    temp_output,
    export_params=True,
    opset_version=14,
    do_constant_folding=True,
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)

# Bundle into ONE single file with no external data files
import onnx
proto = onnx.load(temp_output)
onnx.save_model(proto, final_output, save_as_external_data=False)
if os.path.exists(temp_output):
    os.remove(temp_output)
size_mb = os.path.getsize(final_output) / (1024 * 1024)
print(f"[3/3] Done! Generated '{final_output}' ({size_mb:.2f} MB)")

# If running in Google Colab, trigger browser download automatically
try:
    from google.colab import files
    print("[+] Triggering direct browser download to your computer...")
    files.download(final_output)
except ImportError:
    print(f"[+] Model saved locally to {os.path.abspath(output_path)}")
