# Model Directory (`/backend/model`)

This directory is the production home for the exported ONNX model artifact:
```
backend/model/model.onnx
```

## How to place your trained model here:
1. Run the Google Colab Training Notebook provided in `notebooks/train_vgg16_onnx.py` (or `.ipynb`) on the Kaggle CT Kidney Dataset (12,446 images).
2. The notebook fine-tunes a VGG16 model with Transfer Learning and exports it directly to `model.onnx`.
3. Download the generated `model.onnx` file from Colab and place it in this folder:
   ```
   backend/model/model.onnx
   ```
4. Verify the model file:
   - Input shape: `[1, 3, 224, 224]` (Float32)
   - Output shape: `[1, 4]` (Float32 logits)
   - File size: ~40MB to 70MB (depending on float16 / dynamic quantization)
   - Runtime RAM: Under 100MB on Render / Cloud Web Service

*Note: If `model.onnx` is not present, the backend automatically switches to simulated diagnostic mode so you can run, develop, and demo the full full-stack UI without crashing.*
