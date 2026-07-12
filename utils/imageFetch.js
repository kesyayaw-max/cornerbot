async function fetchImageAsDataUri(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

const fs = require('fs');
const path = require('path');

// Reads a local file (e.g. public/assets/welcome-bg.png) and turns it into a data URI.
// Used instead of an HTTP fetch since the asset already lives on disk.
function fileToDataUri(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.svg' ? 'image/svg+xml' :
      ext === '.webp' ? 'image/webp' :
      'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

module.exports = { fetchImageAsDataUri, fileToDataUri };
