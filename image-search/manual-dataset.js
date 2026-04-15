import { appendToDataset, getDataset } from "./db.js";
import { getEmbedding } from "./embeddings.js";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function normalizeManifest(manifest) {
  if (Array.isArray(manifest)) return manifest;
  if (Array.isArray(manifest?.images)) return manifest.images;
  return [];
}

function getFilenameFromPath(path) {
  return String(path).split("/").pop() || "image";
}

function isSupportedPath(path) {
  const ext = String(path).split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read manual dataset image."));
    reader.readAsDataURL(blob);
  });
}

function createImageElement(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load manual dataset image."));
    img.src = dataURL;
  });
}

export async function syncManualDataset(manifestUrl, onProgress) {
  const response = await fetch(manifestUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Manifest not found at ${manifestUrl}.`);
  }

  const manifest = await response.json();
  const listedPaths = normalizeManifest(manifest).filter(isSupportedPath);
  const existingDatasetPaths = new Set(getDataset().map((entry) => entry.path));
  const newPaths = listedPaths.filter((path) => !existingDatasetPaths.has(path));
  const entries = [];

  for (let i = 0; i < newPaths.length; i += 1) {
    const path = newPaths[i];
    onProgress?.(i + 1, newPaths.length);
    const imageResponse = await fetch(path, { cache: "no-store" });
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch manual image: ${path}`);
    }
    const blob = await imageResponse.blob();
    const dataURL = await blobToDataURL(blob);
    const img = await createImageElement(dataURL);
    const embedding = await getEmbedding(img);
    entries.push({
      filename: getFilenameFromPath(path),
      date: new Date().toISOString().slice(0, 10),
      datasetFolder: "dataset_manual",
      path,
      globalPath: null,
      dataURL,
      embedding,
      source: "manual",
    });
  }

  if (!entries.length) {
    return { ok: true, added: 0, listed: listedPaths.length };
  }

  const status = appendToDataset(entries);
  return { ...status, added: entries.length, listed: listedPaths.length };
}
