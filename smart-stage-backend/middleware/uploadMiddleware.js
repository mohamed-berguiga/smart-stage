const multer = require('multer');
const path = require('path');

// Stockage local dans /uploads. Les noms de fichiers sont rendus imprévisibles
// (horodatage + nombre aléatoire) pour limiter l'accès aux seules personnes qui
// possèdent déjà le lien exact renvoyé par l'API.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// Sécurité : liste blanche d'extensions acceptées (pièces jointes de tâches +
// fichiers d'import Excel/CSV). Bloque notamment les fichiers exécutables/scripts.
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.zip',
];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error(`Type de fichier non autorisé : "${ext}". Formats acceptés : ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
});

module.exports = upload;