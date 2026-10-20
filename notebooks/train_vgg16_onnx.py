"""
Kaggle CT Kidney Dataset (12,446 images): VGG16 Transfer Learning & ONNX Export Pipeline
----------------------------------------------------------------------------------------
This script can be executed in Google Colab with GPU (T4 or V100).
It downloads the Kaggle dataset, trains a VGG16 Transfer Learning model,
evaluates performance, and exports an ultra-lightweight ONNX model (`model.onnx`).
"""

import os
import time
import copy
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim import lr_scheduler
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, random_split

# 1. SETUP & REPRODUCIBILITY
def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)

set_seed()
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"[+] Compute Device: {device}")

# 2. DATA AUGMENTATION & NORMALIZATION
# Standard ImageNet statistics for VGG16
data_transforms = {
    'train': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
    'val': transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
}

# 3. DATASET PREPARATION FUNCTION
def prepare_dataloaders(data_dir: str, batch_size: int = 32):
    """
    Expects data_dir containing 4 subfolders:
    data_dir/
      ├── Cyst/
      ├── Normal/
      ├── Stone/
      └── Tumor/
    """
    full_dataset = datasets.ImageFolder(data_dir, transform=data_transforms['train'])
    class_names = full_dataset.classes
    print(f"[+] Found {len(full_dataset)} images across classes: {class_names}")

    train_size = int(0.80 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    # Apply deterministic validation transforms
    val_dataset.dataset = copy.deepcopy(full_dataset)
    val_dataset.dataset.transform = data_transforms['val']

    dataloaders = {
        'train': DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=True),
        'val': DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    }
    dataset_sizes = {'train': train_size, 'val': val_size}
    return dataloaders, dataset_sizes, class_names

# 4. MODEL BUILDER: VGG16 TRANSFER LEARNING
def build_vgg16_classifier(num_classes=4):
    print("[+] Loading Pretrained VGG16 weights...")
    model = models.vgg16(weights=models.VGG16_Weights.IMAGENET1K_V1)

    # Freeze convolutional feature extraction layers
    for param in model.features.parameters():
        param.requires_grad = False

    # Replace classifier with lightweight head optimized for medical classification
    # Reduces parameter size from 138M to ~15M
    in_features = model.classifier[0].in_features # 25088
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.4),
        nn.Linear(256, 64),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.2),
        nn.Linear(64, num_classes)
    )
    return model

# 5. TRAINING LOOP
def train_model(model, dataloaders, dataset_sizes, criterion, optimizer, scheduler, num_epochs=15):
    since = time.time()
    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0

    for epoch in range(num_epochs):
        print(f"\nEpoch {epoch + 1}/{num_epochs}")
        print("-" * 15)

        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == 'train' and scheduler is not None:
                scheduler.step()

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f"{phase.capitalize()} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

            if phase == 'val' and epoch_acc > best_acc:
                best_acc = epoch_acc
                best_model_wts = copy.deepcopy(model.state_dict())

    time_elapsed = time.time() - since
    print(f"\n[+] Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s")
    print(f"[+] Best Validation Accuracy: {best_acc:.4f}")

    model.load_state_dict(best_model_wts)
    return model

# 6. EXPORT TO COMPACT ONNX RUNTIME FORMAT
def export_to_onnx(model, output_path="model.onnx"):
    print(f"\n[+] Exporting model to ONNX format: {output_path}...")
    model.eval()
    model.to("cpu")

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[+] Export successful! File size: {size_mb:.2f} MB")

    # Optional: Dynamic Quantization to INT8 to compress to ~15-25MB for Render Free Tier
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
        quantized_path = output_path.replace(".onnx", "_quantized.onnx")
        print(f"[+] Quantizing model to INT8: {quantized_path}...")
        quantize_dynamic(
            model_input=output_path,
            model_output=quantized_path,
            weight_type=QuantType.QUInt8
        )
        q_size_mb = os.path.getsize(quantized_path) / (1024 * 1024)
        print(f"[+] Quantization complete! Quantized size: {q_size_mb:.2f} MB")
        print(f"[+] Copy '{quantized_path}' or '{output_path}' to 'backend/model/model.onnx'")
    except ImportError:
        print("[!] Install onnxruntime to perform INT8 quantization.")

def find_dataset_root(base_dir: str = "./dataset") -> str:
    """Auto-detects directory containing Cyst, Normal, Stone, Tumor folders even if nested."""
    required = {"cyst", "normal", "stone", "tumor"}
    if not os.path.exists(base_dir):
        return base_dir

    for root, dirs, _ in os.walk(base_dir):
        lower_dirs = {d.lower() for d in dirs}
        if required.issubset(lower_dirs):
            print(f"[+] Detected dataset classes at: {root}")
            return root
    return base_dir

# MAIN ENTRY POINT
if __name__ == "__main__":
    DATASET_DIR = find_dataset_root("./dataset")
    
    if os.path.exists(DATASET_DIR):
        loaders, sizes, classes = prepare_dataloaders(DATASET_DIR, batch_size=32)
        model = build_vgg16_classifier(num_classes=len(classes)).to(device)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(model.classifier.parameters(), lr=1e-4, weight_decay=1e-2)
        scheduler = lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.5)

        trained_model = train_model(model, loaders, sizes, criterion, optimizer, scheduler, num_epochs=10)
        export_to_onnx(trained_model, "model.onnx")
    else:
        print(f"Dataset path '{DATASET_DIR}' not detected. Review notebooks/README.md for Colab quickstart instructions.")

