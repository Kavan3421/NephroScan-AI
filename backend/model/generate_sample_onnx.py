"""
Utility script to generate a lightweight dummy/sample model.onnx with correct
VGG16 architecture signature:
- Input: [1, 3, 224, 224] float32
- Output: [1, 4] float32 logits
Useful for testing the backend ONNX runtime locally without running the full 12,000 image training first.
"""
import os

def create_sample_onnx(output_path="model.onnx"):
    try:
        import torch
        import torch.nn as nn
        
        print(f"Generating lightweight sample model at: {output_path}...")
        
        class TinyVGG16Classifier(nn.Module):
            def __init__(self, num_classes=4):
                super().__init__()
                self.features = nn.Sequential(
                    nn.Conv2d(3, 16, kernel_size=3, padding=1),
                    nn.ReLU(),
                    nn.AdaptiveAvgPool2d((7, 7))
                )
                self.classifier = nn.Sequential(
                    nn.Flatten(),
                    nn.Linear(16 * 7 * 7, 64),
                    nn.ReLU(),
                    nn.Linear(64, num_classes)
                )
                
            def forward(self, x):
                x = self.features(x)
                return self.classifier(x)

        model = TinyVGG16Classifier(num_classes=4)
        model.eval()

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
        print(f"Successfully generated {output_path} ({os.path.getsize(output_path) / 1024:.2f} KB)!")
    except ImportError:
        print("Note: PyTorch is required to run this generation script. Run in Colab or install torch.")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_file = os.path.join(current_dir, "model.onnx")
    create_sample_onnx(target_file)
