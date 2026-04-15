# Image Similarity Search (Vanilla JS)

A pure front-end image similarity search system built with **HTML + CSS + Vanilla JavaScript** using **TensorFlow.js + MobileNet (CDN)**.

Repository: [yadavanju23/image-search](https://github.com/yadavanju23/image-search)

---

## What was built

- Drag-and-drop query image upload with preview
- MobileNet embedding extraction in browser
- Cosine-similarity search against locally stored dataset
- Threshold slider (live re-filtering without recomputing search)
- Responsive results grid with similarity score + filename
- Per-result image download
- Lightbox preview (fullscreen overlay, outside click/Escape close)
- Dataset uploader (multiple files + folder upload via `webkitdirectory`)
- Date-based path organization (`dataset/YYYY-MM-DD/filename.jpg`)
- Search result JSON logging to `localStorage`
- Download current search JSON and full search log JSON
- Dataset image counter in header
- Error handling for model load, empty dataset, invalid files, quota issues

---

## Tech stack

- **HTML5**
- **CSS3** (custom properties, responsive layout, transitions)
- **Vanilla JavaScript ES Modules**
- **TensorFlow.js (CDN)**
- **MobileNet model (CDN)**
- **Browser localStorage** for dataset + logs

No backend, no Node server, no frameworks, no bundlers.

---

## Project structure

```text
image-search/
├── index.html
├── style.css
├── config.js
├── db.js
├── embeddings.js
├── search.js
├── upload.js
├── results.js
├── logger.js
└── ui.js
```

### Module roles

- `config.js`: constants and storage keys
- `db.js`: read/write localStorage helpers (dataset + logs)
- `embeddings.js`: MobileNet init, embedding extraction, cosine similarity
- `search.js`: score + sort + threshold filtering
- `upload.js`: process dataset uploads and save embeddings
- `results.js`: results rendering, lightbox, per-card download
- `logger.js`: append and download JSON logs
- `ui.js`: main wiring, events, states, interactions

---

## Step-by-step: how to run locally

## 1) Clone repository

```bash
git clone https://github.com/yadavanju23/image-search.git
cd image-search
```

## 2) Start a static server

Use any static server (recommended).

### Option A: Python

```bash
python -m http.server 5500
```

Then open:

`http://localhost:5500/image-search/`

### Option B: VS Code Live Server

- Open project in VS Code/Cursor
- Right click `image-search/index.html`
- Click **Open with Live Server**

## 3) Wait for model load

- App shows loading spinner while MobileNet initializes
- Search button enables once model is ready

---

## Step-by-step: how to use

## 1) Add dataset images

- Go to **Add to Dataset** section
- Select multiple images or an entire folder
- Supported formats: **JPG, PNG, WEBP** only
- Wait for progress text (`Processing X of Y images…`)
- Each upload creates a brand new dataset folder:
  - `dataset_YYYY-MM-DD_HH-MM-SS-sss`
- Same uploaded files are also stored in:
  - `/global-images/`
- Duplicate names are auto-renamed safely (`image_1.jpg`, etc.)
- Dataset counter updates automatically

## 2) Upload query image

- Use top drag-drop area (or click to choose)
- Query preview appears immediately

## 3) Search

- Adjust threshold (default `0.60`)
- Click **Search**
- Results are sorted highest similarity first

## 4) Interact with results

- Click card to open lightbox
- Click **Download** on a card to save matched image

## 5) Export JSON

- **Download results as JSON** -> current search only
- **Download full search log** -> all logged searches

---

## Data storage

Data is stored in browser `localStorage`:

- `dataset`: array of all searchable dataset entries (across all upload batches)
- `global_images`: array of all uploaded images in virtual `/global-images/`
- `search_log`: array of search result objects

Example dataset entry:

```json
{
  "filename": "shoe_01.jpg",
  "date": "2026-04-15",
  "datasetFolder": "dataset_2026-04-15_12-05-38-102",
  "path": "dataset_2026-04-15_12-05-38-102/shoe_01.jpg",
  "globalPath": "/global-images/shoe_01.jpg",
  "dataURL": "data:image/jpeg;base64,...",
  "embedding": [0.023, 0.187]
}
```

Example global image entry:

```json
{
  "filename": "shoe_01.jpg",
  "path": "/global-images/shoe_01.jpg",
  "dataURL": "data:image/jpeg;base64,...",
  "uploadedAt": "2026-04-15T12:05:38.102Z"
}
```

> Note: localStorage is browser-specific. Clearing browser site data removes stored dataset/log.

---

## Features and behavior details

- Query input validates image MIME type
- Dataset upload accepts only `image/jpeg`, `image/png`, `image/webp`
- Unsupported files are skipped safely
- Upload flow is: save to `/global-images/` -> create new `dataset_...` folder -> save searchable dataset copies
- Old dataset folders are never overwritten (every upload creates a new folder)
- Threshold slider updates label live and re-filters instantly
- Search button disabled while model loads / while operations run
- Friendly empty state when no matches found
- Persistent model error banner with Retry button
- Quota/full localStorage handled gracefully without app crash

---

## How similarity works

1. MobileNet extracts a feature embedding vector for each image.
2. Query embedding is compared against dataset embeddings.
3. Cosine similarity score is calculated:
   - `1.0` -> very similar
   - `0.0` -> unrelated
4. Results with `similarity >= threshold` are shown.

---

## Deploy (make it live)

This is a static front-end app, so deployment is easy.

### Option 1: GitHub Pages (recommended)

1. Push code to GitHub (already done).
2. Open repository settings:
   - `Settings` -> `Pages`
3. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
4. Save and wait 1-2 minutes.
5. Your live site URL will appear in the Pages section.

If it serves root, app URL may be:

- `https://yadavanju23.github.io/image-search/image-search/`

(because app files are inside the `image-search/` subfolder)

### Option 2: Netlify

1. Login at Netlify
2. Import from GitHub repo
3. Build command: **(leave empty)**
4. Publish directory: `image-search`
5. Deploy

### Option 3: Vercel

1. Import GitHub repo in Vercel
2. Framework preset: **Other**
3. Build command: **none**
4. Output directory: `image-search`
5. Deploy

---

## Limitations

- No backend: all data stays in user browser localStorage
- Large datasets may hit localStorage quota
- Model and dataset persistence are per browser/device
- `/global-images/` and `dataset_...` are virtual storage paths (not real OS folders)
- Requires internet on first load for CDN scripts

---

## Future improvements (optional)

- Add clear/reset dataset + log buttons
- Add pagination for large result sets
- Add zip export of matched images
- Add PWA offline cache for model scripts

---

## License

Use any license you prefer (MIT recommended).