import { appendGlobalImages, appendToDataset, getGlobalImages } from "./db.js";
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

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function createDatasetFolderTimestamp() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);
  const timePart = now
    .toTimeString()
    .slice(0, 8)
    .replace(/:/g, "-");
  const msPart = String(now.getMilliseconds()).padStart(3, "0");
  return `dataset_${datePart}_${timePart}-${msPart}`;
}

function splitFilename(name) {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return { base: name, ext: "" };
  return {
    base: name.slice(0, dotIndex),
    ext: name.slice(dotIndex),
  };
}

function makeUniqueFilename(originalName, usedNames) {
  const { base, ext } = splitFilename(originalName);
  let candidate = originalName;
  let counter = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base}_${counter}${ext}`;
    counter += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

export async function processDatasetFiles(files, onProgress) {
  const supportedFiles = Array.from(files).filter((file) => ALLOWED_MIME_TYPES.has(file.type));
  const skipped = files.length - supportedFiles.length;
  const existingGlobal = getGlobalImages();
  const globalUsedNames = new Set(existingGlobal.map((entry) => String(entry.filename).toLowerCase()));
  const datasetUsedNames = new Set();
  const datasetFolder = createDatasetFolderTimestamp();
  const date = new Date().toISOString().slice(0, 10);
  const globalEntries = [];
  const datasetEntries = [];

  for (let i = 0; i < supportedFiles.length; i += 1) {
    const file = supportedFiles[i];
    onProgress?.(i + 1, supportedFiles.length);
    const dataURL = await fileToDataURL(file);
    const img = await createImageElement(dataURL);
    const embedding = await getEmbedding(img);

    const globalFilename = makeUniqueFilename(file.name, globalUsedNames);
    const datasetFilename = makeUniqueFilename(file.name, datasetUsedNames);

    globalEntries.push({
      filename: globalFilename,
      path: `/global-images/${globalFilename}`,
      dataURL,
      uploadedAt: new Date().toISOString(),
    });

    datasetEntries.push({
      filename: datasetFilename,
      date,
      datasetFolder,
      path: `${datasetFolder}/${datasetFilename}`,
      globalPath: `/global-images/${globalFilename}`,
      dataURL,
      embedding,
    });
  }

  const globalSaveStatus = appendGlobalImages(globalEntries);
  if (!globalSaveStatus.ok) {
    return {
      ...globalSaveStatus,
      added: 0,
      skipped,
      datasetFolder,
    };
  }

  const datasetSaveStatus = appendToDataset(datasetEntries);
  return {
    ...datasetSaveStatus,
    added: datasetEntries.length,
    skipped,
    datasetFolder,
  };
}
