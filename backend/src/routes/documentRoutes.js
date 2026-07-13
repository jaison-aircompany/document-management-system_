/**
 * documentRoutes - Definição de endpoints
 *
 * Responsável por:
 * - Registrar endpoints Express
 * - Configurar multer para upload
 * - Delegar para controllers
 */

const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

/**
 * Factory para criar router com dependências injetadas
 * @param {DocumentController} documentController - Controller injetado
 * @returns {Router} Router Express configurado
 */
function createDocumentRouter(documentController) {
  // Configurar multer para diskStorage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Destino: backend/storage
      const storageDir = path.join(__dirname, '../../storage');
      cb(null, storageDir);
    },
    filename: (req, file, cb) => {
      // Nome temporário durante upload (será renomeado pelo controller)
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || 52428800, 10) // 50MB default
    }
  });

  // POST /api/upload
  router.post('/upload', upload.single('file'), (req, res) =>
    documentController.upload(req, res)
  );

  // GET /api/documents
  router.get('/documents', (req, res) =>
    documentController.list(req, res)
  );

  // GET /api/documents/:id/download
  router.get('/documents/:id/download', (req, res) =>
    documentController.download(req, res)
  );

  return router;
}

module.exports = createDocumentRouter;
