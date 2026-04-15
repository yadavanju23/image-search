import { appendToDataset } from "./db.js";
import { getEmbedding } from "./embeddings.js";

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function createImageElement(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for embedding extraction."));
    img.src = dataURL;
  });
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export async function processDatasetFiles(files, onProgress) {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
  const skipped = files.length - imageFiles.length;
  const entries = [];
  const date = todayISODate();

  for (let i = 0; i < imageFiles.length; i += 1) {
    const file = imageFiles[i];
    onProgress?.(i + 1, imageFiles.length);
    const dataURL = await fileToDataURL(file);
    const img = await createImageElement(dataURL);
    const embedding = await getEmbedding(img);
    entries.push({
      filename: file.name,
      date,
      path: `dataset/${date}/${file.name}`,
      dataURL,
      embedding,
    });
  }

  const saveStatus = appendToDataset(entries);
  return { ...saveStatus, added: entries.length, skipped };
}
