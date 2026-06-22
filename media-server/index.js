const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const MEDIA_ROOT = path.join(__dirname, 'media');

// ── Folders ──────────────────────────────────────────────────────────────────
const FOLDERS = {
  videos:      path.join(MEDIA_ROOT, 'shots', 'videos'),
  thumbnails:  path.join(MEDIA_ROOT, 'shots', 'thumbnails'),
  playerImages:path.join(MEDIA_ROOT, 'players', 'images'),
  logos:       path.join(MEDIA_ROOT, 'logos'),
  uebungen:    path.join(MEDIA_ROOT, 'uebungen'),
};
Object.values(FOLDERS).forEach(dir => fs.mkdirSync(dir, { recursive: true }));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use('/media', express.static(MEDIA_ROOT));

// ── Multer storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const type = req.body.type || req.query.type || 'thumbnail';
    if      (type === 'video')    cb(null, FOLDERS.videos);
    else if (type === 'player')   cb(null, FOLDERS.playerImages);
    else if (type === 'logo')     cb(null, FOLDERS.logos);
    else if (type === 'uebung')   cb(null, FOLDERS.uebungen);
    else                          cb(null, FOLDERS.thumbnails);
  },
  filename(req, file, cb) {
    const id  = req.body.id || req.query.id || uuidv4();
    const ext = path.extname(file.originalname) || guessExt(file.mimetype);
    cb(null, `${id}${ext}`);
  },
});

function guessExt(mime) {
  if (mime.includes('mp4'))  return '.mp4';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('png'))  return '.png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  return '';
}

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max
});

// ── Metadata store (simple JSON file next to this script) ─────────────────────
const META_PATH = path.join(__dirname, 'metadata.json');
function readMeta() {
  try { return JSON.parse(fs.readFileSync(META_PATH, 'utf8')); }
  catch { return {}; }
}
function writeMeta(data) {
  fs.writeFileSync(META_PATH, JSON.stringify(data, null, 2));
}

// ── POST /api/upload ──────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });

  const type = req.body.type || 'thumbnail';
  const id   = req.body.id   || uuidv4();

  let urlPath;
  if      (type === 'video')   urlPath = `/media/shots/videos/${req.file.filename}`;
  else if (type === 'player')  urlPath = `/media/players/images/${req.file.filename}`;
  else if (type === 'logo')    urlPath = `/media/logos/${req.file.filename}`;
  else if (type === 'uebung')  urlPath = `/media/uebungen/${req.file.filename}`;
  else                         urlPath = `/media/shots/thumbnails/${req.file.filename}`;

  const url = `${BASE_URL}${urlPath}`;

  // Track video expiry (48 h from now)
  if (type === 'video') {
    const meta = readMeta();
    meta[req.file.filename] = {
      id,
      path: req.file.path,
      expires_at: Date.now() + 48 * 60 * 60 * 1000,
    };
    writeMeta(meta);
  }

  res.json({ url, filename: req.file.filename, id });
});

// ── POST /api/test-connection ─────────────────────────────────────────────────
app.post('/api/test-connection', (_req, res) => {
  res.json({ ok: true, message: 'Media Server erreichbar', time: new Date().toISOString() });
});

// ── POST /api/check-folders ───────────────────────────────────────────────────
app.post('/api/check-folders', (_req, res) => {
  const status = {};
  Object.entries(FOLDERS).forEach(([name, dir]) => {
    fs.mkdirSync(dir, { recursive: true });
    status[name] = { path: dir, ok: true };
  });
  res.json({ ok: true, folders: status });
});

// ── DELETE /api/media/:filename ───────────────────────────────────────────────
app.delete('/api/media/:filename', (req, res) => {
  const { filename } = req.params;
  const meta = readMeta();
  const entry = meta[filename];
  if (entry) {
    try { fs.unlinkSync(entry.path); } catch {}
    delete meta[filename];
    writeMeta(meta);
    return res.json({ ok: true, deleted: filename });
  }
  // Try all folders
  for (const dir of Object.values(FOLDERS)) {
    const fp = path.join(dir, filename);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      return res.json({ ok: true, deleted: filename });
    }
  }
  res.status(404).json({ error: 'File not found' });
});

// ── GET /api/storage-stats ────────────────────────────────────────────────────
app.get('/api/storage-stats', (_req, res) => {
  const stats = {};
  Object.entries(FOLDERS).forEach(([name, dir]) => {
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    let totalBytes = 0;
    files.forEach(f => {
      try { totalBytes += fs.statSync(path.join(dir, f)).size; } catch {}
    });
    stats[name] = { count: files.length, bytes: totalBytes };
  });
  const meta = readMeta();
  stats.tracked_videos  = Object.keys(meta).length;
  res.json(stats);
});

// ── Cron: daily cleanup of expired videos ─────────────────────────────────────
cron.schedule('0 3 * * *', () => {
  console.log('[cron] Checking for expired videos...');
  const meta = readMeta();
  const now  = Date.now();
  let deleted = 0;
  Object.entries(meta).forEach(([filename, entry]) => {
    if (entry.expires_at && entry.expires_at < now) {
      try {
        fs.unlinkSync(entry.path);
        console.log(`[cron] Deleted expired video: ${filename}`);
        deleted++;
      } catch (e) {
        console.warn(`[cron] Could not delete ${filename}:`, e.message);
      }
      delete meta[filename];
    }
  });
  writeMeta(meta);
  console.log(`[cron] Cleanup done. Deleted ${deleted} file(s).`);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`MatchFlow Media Server running on port ${PORT}`);
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`Media root: ${MEDIA_ROOT}`);
});
