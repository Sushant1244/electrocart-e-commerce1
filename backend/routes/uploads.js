const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/uploads/list -> returns array of filenames in uploads folder
router.get('/list', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const files = await fs.promises.readdir(uploadsDir);
    // Filter out hidden/system files (like .DS_Store), directories, and non-image files
    const allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];
    const onlyFiles = [];
    for (const f of files) {
      if (!f || f.startsWith('.')) continue; // skip dotfiles
      const full = path.join(uploadsDir, f);
      const stat = await fs.promises.stat(full);
      if (!stat.isFile()) continue;
      const ext = path.extname(f).toLowerCase();
      if (!allowedExt.includes(ext)) continue;
      onlyFiles.push(f);
    }
    res.json(onlyFiles);
  } catch (err) {
    console.error('uploads list error', err.message || err);
    res.status(500).json({ message: 'Failed to list uploads', error: err.message });
  }
});

module.exports = router;
