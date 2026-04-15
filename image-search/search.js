import { cosineSimilarity } from "./embeddings.js";

export function searchDataset(queryEmbedding, datasetEntries) {
  if (!Array.isArray(datasetEntries) || datasetEntries.length === 0) return [];

  return datasetEntries
    .map((entry) => ({
      ...entry,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

export function filterByThreshold(results, threshold) {
  return results.filter((item) => item.similarity >= threshold);
}
