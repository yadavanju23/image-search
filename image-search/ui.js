import { DEFAULT_THRESHOLD } from "./config.js";
import { getDataset } from "./db.js";
import { initMobileNet, isModelReady, getEmbedding, resetModel } from "./embeddings.js";
import { appendLog, downloadCurrentResult, downloadFullLog } from "./logger.js";
import { initLightbox, renderResults } from "./results.js";
import { filterByThreshold, searchDataset } from "./search.js";
import { processDatasetFiles } from "./upload.js";

const state = {
  queryFile: null,
  queryImageEl: null,
  allScoredResults: [],
  filteredResults: [],
  currentThreshold: DEFAULT_THRESHOLD,
  latestResultEntry: null,
  searching: false,
  uploading: false,
};

const els = {
  datasetCounter: document.getElementById("datasetCounter"),
  modelLoading: document.getElementById("modelLoading"),
  errorBanner: document.getElementById("errorBanner"),
  errorBannerText: document.getElementById("errorBannerText"),
  retryModelBtn: document.getElementById("retryModelBtn"),
  dropZone: document.getElementById("dropZone"),
  queryInput: document.getElementById("queryInput"),
  queryPreview: document.getElementById("queryPreview"),
  dropZonePrompt: document.getElementById("dropZonePrompt"),
  queryError: document.getElementById("queryError"),
  thresholdRange: document.getElementById("thresholdRange"),
  thresholdValue: document.getElementById("thresholdValue"),
  searchBtn: document.getElementById("searchBtn"),
  downloadCurrentBtn: document.getElementById("downloadCurrentBtn"),
  controlsError: document.getElementById("controlsError"),
  resultsTitle: document.getElementById("resultsTitle"),
  resultsContainer: document.getElementById("resultsContainer"),
  resultsEmpty: document.getElementById("resultsEmpty"),
  datasetInput: document.getElementById("datasetInput"),
  uploadStatus: document.getElementById("uploadStatus"),
  uploadError: document.getElementById("uploadError"),
  downloadLogBtn: document.getElementById("downloadLogBtn"),
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightboxImage"),
  lightboxClose: document.getElementById("lightboxClose"),
};

function setInlineError(element, message) {
  element.textContent = message || "";
  element.classList.toggle("hidden", !message);
}

function updateDatasetCounter() {
  els.datasetCounter.textContent = `Dataset: ${getDataset().length} images`;
}

function updateSearchButtonState() {
  const disabled = !isModelReady() || state.searching || state.uploading;
  els.searchBtn.disabled = disabled;
  els.searchBtn.title = !isModelReady() ? "Model still loading, please wait" : "";
}

function updateThresholdLabel() {
  els.thresholdValue.textContent = state.currentThreshold.toFixed(2);
}

function refreshFilteredResults() {
  state.filteredResults = filterByThreshold(state.allScoredResults, state.currentThreshold);
  renderResults(state.filteredResults, els.resultsContainer, els.resultsEmpty);
  els.resultsTitle.textContent = `Results (${state.filteredResults.length} matches)`;
}

function createImageFromDataURL(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load selected image."));
    img.src = dataURL;
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read selected file."));
    reader.readAsDataURL(file);
  });
}

async function setQueryFile(file) {
  setInlineError(els.queryError, "");
  if (!file || !file.type.startsWith("image/")) {
    setInlineError(els.queryError, "Please select a valid image file.");
    return;
  }

  try {
    const dataURL = await readFileAsDataURL(file);
    els.queryPreview.src = dataURL;
    els.queryPreview.classList.remove("hidden");
    els.dropZonePrompt.classList.add("hidden");
    state.queryImageEl = await createImageFromDataURL(dataURL);
    state.queryFile = file;
  } catch (error) {
    setInlineError(els.queryError, error.message);
  }
}

function showModelError(message) {
  els.errorBannerText.textContent = message;
  els.errorBanner.classList.remove("hidden");
}

function hideModelError() {
  els.errorBanner.classList.add("hidden");
}

async function loadModel() {
  els.modelLoading.classList.remove("hidden");
  updateSearchButtonState();
  try {
    await initMobileNet();
    hideModelError();
  } catch (error) {
    showModelError(`Failed to load MobileNet. ${error.message}`);
  } finally {
    els.modelLoading.classList.toggle("hidden", isModelReady());
    updateSearchButtonState();
  }
}

async function runSearch() {
  setInlineError(els.controlsError, "");

  if (!isModelReady()) {
    setInlineError(els.controlsError, "Model still loading, please wait");
    return;
  }

  if (!state.queryImageEl || !state.queryFile) {
    setInlineError(els.controlsError, "Upload a query image first.");
    return;
  }

  const dataset = getDataset();
  if (!dataset.length) {
    setInlineError(els.controlsError, "Dataset is empty. Add images first.");
    return;
  }

  state.searching = true;
  updateSearchButtonState();

  try {
    const queryEmbedding = await getEmbedding(state.queryImageEl);
    state.allScoredResults = searchDataset(queryEmbedding, dataset);
    refreshFilteredResults();

    const entry = {
      timestamp: new Date().toISOString(),
      query_filename: state.queryFile.name,
      threshold: Number(state.currentThreshold.toFixed(2)),
      results: state.filteredResults.map((result) => ({
        filename: result.filename,
        path: result.path,
        similarity: Number(result.similarity.toFixed(2)),
      })),
    };

    const saveStatus = appendLog(entry);
    if (!saveStatus.ok) {
      setInlineError(els.controlsError, `${saveStatus.error} Search still completed.`);
    }

    state.latestResultEntry = entry;
    els.downloadCurrentBtn.classList.remove("hidden");
  } catch (error) {
    setInlineError(els.controlsError, `Search failed: ${error.message}`);
  } finally {
    state.searching = false;
    updateSearchButtonState();
  }
}

async function handleDatasetUpload(files) {
  setInlineError(els.uploadError, "");
  if (!isModelReady()) {
    setInlineError(els.uploadError, "Model still loading, please wait");
    return;
  }

  if (!files || !files.length) return;

  state.uploading = true;
  updateSearchButtonState();
  els.uploadStatus.classList.remove("hidden");
  els.uploadStatus.innerHTML = `<span class="spinner" aria-hidden="true"></span> Preparing upload...`;

  try {
    const uploadResult = await processDatasetFiles(files, (current, total) => {
      els.uploadStatus.textContent = `Processing ${current} of ${total} images…`;
    });

    if (!uploadResult.ok) {
      setInlineError(els.uploadError, uploadResult.error);
    }

    els.uploadStatus.textContent = `Added ${uploadResult.added} image(s)${
      uploadResult.skipped ? `, skipped ${uploadResult.skipped} non-image file(s)` : ""
    }.`;
    updateDatasetCounter();
  } catch (error) {
    setInlineError(els.uploadError, `Upload failed: ${error.message}`);
    els.uploadStatus.textContent = "";
  } finally {
    state.uploading = false;
    updateSearchButtonState();
  }
}

function bindDragDrop() {
  const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  ["dragenter", "dragover", "dragleave", "drop"].forEach((name) => {
    els.dropZone.addEventListener(name, preventDefaults);
  });

  ["dragenter", "dragover"].forEach((name) => {
    els.dropZone.addEventListener(name, () => els.dropZone.classList.add("drag-over"));
  });

  ["dragleave", "drop"].forEach((name) => {
    els.dropZone.addEventListener(name, () => els.dropZone.classList.remove("drag-over"));
  });

  els.dropZone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    setQueryFile(file);
  });
}

function bindEvents() {
  els.dropZone.addEventListener("click", () => els.queryInput.click());
  els.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.queryInput.click();
    }
  });
  els.queryInput.addEventListener("change", (event) => setQueryFile(event.target.files[0]));

  els.thresholdRange.addEventListener("input", (event) => {
    state.currentThreshold = Number(event.target.value);
    updateThresholdLabel();
    if (state.allScoredResults.length) {
      refreshFilteredResults();
    }
  });

  els.searchBtn.addEventListener("click", runSearch);
  els.downloadCurrentBtn.addEventListener("click", () => {
    if (state.latestResultEntry) downloadCurrentResult(state.latestResultEntry);
  });
  els.downloadLogBtn.addEventListener("click", downloadFullLog);
  els.datasetInput.addEventListener("change", (event) => handleDatasetUpload(event.target.files));

  els.retryModelBtn.addEventListener("click", async () => {
    resetModel();
    await loadModel();
  });
}

function init() {
  updateDatasetCounter();
  updateThresholdLabel();
  bindDragDrop();
  bindEvents();
  initLightbox(els.lightbox, els.lightboxImage, els.lightboxClose, els.resultsContainer);
  loadModel();
}

init();
