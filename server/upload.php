<?php
/**
 * MatchFlow Media Server – Upload API
 * Auf Webserver hochladen nach: /matchflow-api/upload.php
 *
 * Ordnerstruktur auf dem Server:
 *   /uploads/videos/
 *   /uploads/thumbnails/
 *   /uploads/players/
 *
 * CORS: Passe ALLOWED_ORIGIN auf deine Domain an.
 */

define('ALLOWED_ORIGIN', '*'); // oder z.B. 'https://deine-domain.at'
define('UPLOAD_BASE',    __DIR__ . '/uploads');
define('MAX_SIZE_MB',    50);

header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// Endpoint: ?action=... (query param) oder letzter URL-Pfad-Segment
$endpoint = $_GET['action'] ?? '';
if (!$endpoint) {
  $path     = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
  $segments = explode('/', $path);
  $endpoint = end($segments);
}

switch ($endpoint) {
  case 'test-connection': testConnection(); break;
  case 'check-folders':   checkFolders();   break;
  case 'storage-stats':   storageStats();   break;
  case 'upload':          handleUpload();   break;
  case 'list':            listFiles();      break;
  case 'delete':          deleteFile();     break;
  default:
    json(['error' => 'Unknown endpoint: ' . $endpoint . ' (use ?action=test-connection etc.)'], 404);
}

// ── Endpoints ────────────────────────────────────────────────

function testConnection() {
  json(['ok' => true, 'message' => 'MatchFlow Media Server verbunden ✓', 'time' => date('H:i:s')]);
}

function checkFolders() {
  $folders = ['videos', 'thumbnails', 'players'];
  $result  = [];
  foreach ($folders as $f) {
    $p = UPLOAD_BASE . '/' . $f;
    if (!is_dir($p)) @mkdir($p, 0755, true);
    $result[$f] = ['ok' => is_dir($p) && is_writable($p), 'path' => $p];
  }
  json(['folders' => $result]);
}

function storageStats() {
  $types = ['videos' => 'videos', 'thumbnails' => 'thumbnails', 'playerImages' => 'players'];
  $stats = [];
  foreach ($types as $key => $dir) {
    $p = UPLOAD_BASE . '/' . $dir;
    $files = is_dir($p) ? glob($p . '/*') : [];
    $bytes = 0;
    foreach ($files as $f) $bytes += filesize($f);
    $stats[$key] = ['count' => count($files), 'bytes' => $bytes];
  }
  json(array_merge($stats, ['tracked_videos' => count(glob(UPLOAD_BASE . '/videos/*') ?: [])]));
}

function handleUpload() {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') { json(['error' => 'POST required'], 405); return; }
  if (!isset($_FILES['file'])) { json(['error' => 'No file'], 400); return; }

  $file = $_FILES['file'];
  if ($file['error'] !== UPLOAD_ERR_OK) { json(['error' => 'Upload error ' . $file['error']], 400); return; }
  if ($file['size'] > MAX_SIZE_MB * 1024 * 1024) { json(['error' => 'File too large (max ' . MAX_SIZE_MB . ' MB)'], 413); return; }

  $type = $_POST['type'] ?? 'misc';
  $id   = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $_POST['id'] ?? uniqid());

  $dirMap = ['video' => 'videos', 'thumbnail' => 'thumbnails', 'player' => 'players'];
  $dir    = $dirMap[$type] ?? 'misc';
  $folder = UPLOAD_BASE . '/' . $dir;
  if (!is_dir($folder)) @mkdir($folder, 0755, true);

  $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
  $allowed  = ['jpg','jpeg','png','gif','webp','mp4','mov','avi','webm','pdf'];
  if (!in_array($ext, $allowed)) { json(['error' => 'File type not allowed: ' . $ext], 400); return; }

  $filename = $id . '.' . $ext;
  $target   = $folder . '/' . $filename;

  if (!move_uploaded_file($file['tmp_name'], $target)) { json(['error' => 'Could not save file'], 500); return; }

  $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
  $relPath = str_replace(UPLOAD_BASE, '', $folder) . '/' . $filename;
  $url     = rtrim($baseUrl, '/') . '/matchflow-api/uploads' . $relPath;

  json(['ok' => true, 'url' => $url, 'filename' => $filename, 'size' => $file['size']]);
}

function listFiles() {
  $type   = $_GET['type'] ?? 'players';
  $dirMap = ['video' => 'videos', 'thumbnail' => 'thumbnails', 'player' => 'players'];
  $dir    = $dirMap[$type] ?? $type;
  $folder = UPLOAD_BASE . '/' . $dir;
  $files  = is_dir($folder) ? array_values(array_filter(scandir($folder), fn($f) => !in_array($f, ['.','..']))) : [];
  json(['files' => $files]);
}

function deleteFile() {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') { json(['error' => 'POST required'], 405); return; }
  $data = json_decode(file_get_contents('php://input'), true);
  $filename = basename($data['filename'] ?? '');
  $type     = $data['type'] ?? 'players';
  $dirMap   = ['video' => 'videos', 'thumbnail' => 'thumbnails', 'player' => 'players'];
  $dir      = $dirMap[$type] ?? $type;
  $path     = UPLOAD_BASE . '/' . $dir . '/' . $filename;
  if (!file_exists($path)) { json(['error' => 'File not found'], 404); return; }
  unlink($path);
  json(['ok' => true]);
}

// ── Helper ───────────────────────────────────────────────────
function json($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  exit;
}
