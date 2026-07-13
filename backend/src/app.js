// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const path = require('path');

// Importar camadas
const DocumentRepository = require('./repositories/DocumentRepository');
const DocumentService = require('./services/DocumentService');
const DocumentController = require('./controllers/DocumentController');
const createDocumentRouter = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Inicializar dependências (injeção simples)
const storageDir = process.env.STORAGE_DIR || path.join(__dirname, '../storage');
const documentRepository = new DocumentRepository(storageDir);
const documentService = new DocumentService(documentRepository);
const documentController = new DocumentController(documentService);

// Registrar router de documentos com prefixo /api
const documentRouter = createDocumentRouter(documentController);
app.use('/api', documentRouter);

// Endpoint de verificação de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
    console.log(`Storage: ${storageDir}`);
  });
}

module.exports = app;
