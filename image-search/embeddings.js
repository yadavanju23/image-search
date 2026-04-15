let modelInstance = null;

export async function initMobileNet() {
  if (modelInstance) return modelInstance;
  // MobileNet v1 alpha 1.0 exposes a 1024-d penultimate embedding.
  modelInstance = await window.mobilenet.load({ version: 1, alpha: 1.0 });
  return modelInstance;
}

export function resetModel() {
  modelInstance = null;
}

export function isModelReady() {
  return Boolean(modelInstance);
}

export async function getEmbedding(imageElement) {
  if (!modelInstance) {
    throw new Error("MobileNet is not ready yet.");
  }

  const embeddingTensor = modelInstance.infer(imageElement, true);
  const values = await embeddingTensor.data();
  embeddingTensor.dispose();
  return Array.from(values);
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom ? dot / denom : 0;
}
