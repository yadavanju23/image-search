import { appendSearchLog, getSearchLog } from "./db.js";

function slugify(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "query";
}

function downloadObject(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function appendLog(entry) {
  return appendSearchLog(entry);
}

export function downloadCurrentResult(result) {
  const timestamp = result.timestamp.replace(/[:.]/g, "-");
  const base = result.query_filename.replace(/\.[^.]+$/, "");
  const filename = `results_${slugify(base)}_${timestamp}.json`;
  downloadObject(result, filename);
}

export function downloadFullLog() {
  downloadObject(getSearchLog(), "search_log.json");
}
