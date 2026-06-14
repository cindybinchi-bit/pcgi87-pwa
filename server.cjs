const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Servir les fichiers statiques avec cache
app.use(express.static(DIST_DIR, {
  maxAge: '1h',
  setHeaders: (res, filepath) => {
    // Service Worker ne doit jamais être en cache
    if (filepath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Manifest aussi
    if (filepath.endsWith('manifest.webmanifest')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Redirection SPA - toutes les routes non-fichier vont à index.html
app.get('*', (req, res) => {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Page non trouvée');
  }
});

app.listen(PORT, () => {
  console.log(`
🌿 Mon Espace PCGI 87
📱 Serveur PWA démarré
🔗 http://localhost:${PORT}
  `);
});
