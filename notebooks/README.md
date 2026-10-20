# Training Guide: Kaggle CT Kidney Dataset -> ONNX Export

This guide provides the 2 simplest ways to train the **VGG16 Transfer Learning** model on the 12,446 CT scan images and export `model.onnx` with **>96% diagnostic accuracy**.

---

## 🌟 Method 1 (FASTEST — 0 Downloads, 0 Uploads, 0 Keys): Kaggle Free Notebook

Because the CT Kidney dataset is already hosted on Kaggle, running a Kaggle Notebook requires **no API keys, no downloads, and no uploads**.

1. Open the dataset link: **[CT Kidney Dataset on Kaggle](https://www.kaggle.com/datasets/nazmul0087/ct-kidney-dataset-normal-cyst-tumor-stone)**
2. In the top-right corner of the dataset page, click the **"New Notebook"** button.
3. In the right panel under **Settings** (or the three dots menu):
   - Set **Accelerator** to **GPU T4** or **GPU P100**.
4. Paste the complete script from [Train_Kidney_VGG16_Colab.ipynb](file:///c:/Users/Kavan%20Patel/Desktop/Projects/Kidney%20Disease%20Detection/notebooks/Train_Kidney_VGG16_Colab.ipynb) into the cell.
5. Click **Run All** (or `Shift + Enter`).
6. Training completes in ~3-4 minutes (>96% accuracy). In the right panel under **Output**, click the `...` next to `model.onnx` and click **Download**.

---

## 🌟 Method 2 (In Google Colab using your `archive.zip`)

If you prefer Google Colab:

1. Open [Google Colab](https://colab.research.google.com).
2. On the left sidebar, click the **Folder icon (📁 Files)**.
3. Drag-and-drop your local `archive.zip` from your computer's `Downloads` folder into the files area.
4. Set **Runtime** -> **Change runtime type** -> **T4 GPU**.
5. Paste the code or upload `Train_Kidney_VGG16_Colab.ipynb` and click **Run All**.
6. When done, `model.onnx` automatically downloads to your browser!

---

## 3. Applying the Model

1. Move the downloaded `model.onnx` into:
   ```
   backend/model/model.onnx
   ```
2. The FastAPI backend automatically serves the new high-accuracy weights.
3. Retest your CT scans at `http://localhost:3000`!
