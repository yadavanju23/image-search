function createDownloadButton(result) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Download";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const link = document.createElement("a");
    link.href = result.dataURL;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
  return button;
}

export function renderResults(results, container, emptyState) {
  container.innerHTML = "";

  if (!results.length) {
    emptyState.textContent = "No matches found. Try lowering the threshold.";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.dataset.image = result.dataURL;

    const img = document.createElement("img");
    img.src = result.dataURL;
    img.alt = result.filename;

    const body = document.createElement("div");
    body.className = "result-card-body";

    const score = document.createElement("strong");
    score.textContent = `${(result.similarity * 100).toFixed(1)}% similar`;

    const name = document.createElement("span");
    name.className = "result-name";
    name.textContent = result.filename;

    body.append(score, name, createDownloadButton(result));
    card.append(img, body);
    container.appendChild(card);
  });
}

export function initLightbox(lightbox, imageElement, closeButton, resultsContainer) {
  const close = () => lightbox.classList.add("hidden");
  const open = (src) => {
    imageElement.src = src;
    lightbox.classList.remove("hidden");
  };

  resultsContainer.addEventListener("click", (event) => {
    const card = event.target.closest(".result-card");
    if (!card) return;
    open(card.dataset.image);
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  closeButton.addEventListener("click", close);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}
