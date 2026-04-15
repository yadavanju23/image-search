import { STORAGE_KEY_DATASET, STORAGE_KEY_GLOBAL_IMAGES, STORAGE_KEY_LOG } from "./config.js";

function parseArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isQuotaError(error) {
  return (
    error instanceof DOMException &&
    (error.code === 22 ||
      error.code === 1014 ||
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function writeArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, error: "Storage full. Could not save to localStorage." };
    }
    return { ok: false, error: "Failed to write localStorage data." };
  }
}

export function getDataset() {
  return parseArray(localStorage.getItem(STORAGE_KEY_DATASET));
}

export function saveDataset(entries) {
  return writeArray(STORAGE_KEY_DATASET, entries);
}

export function appendToDataset(newEntries) {
  const existing = getDataset();
  const combined = existing.concat(newEntries);
  const status = saveDataset(combined);
  return { ...status, data: combined };
}

export function getGlobalImages() {
  return parseArray(localStorage.getItem(STORAGE_KEY_GLOBAL_IMAGES));
}

export function saveGlobalImages(entries) {
  return writeArray(STORAGE_KEY_GLOBAL_IMAGES, entries);
}

export function appendGlobalImages(newEntries) {
  const existing = getGlobalImages();
  const combined = existing.concat(newEntries);
  const status = saveGlobalImages(combined);
  return { ...status, data: combined };
}

export function getSearchLog() {
  return parseArray(localStorage.getItem(STORAGE_KEY_LOG));
}

export function saveSearchLog(entries) {
  return writeArray(STORAGE_KEY_LOG, entries);
}

export function appendSearchLog(entry) {
  const existing = getSearchLog();
  const combined = existing.concat(entry);
  const status = saveSearchLog(combined);
  return { ...status, data: combined };
}
