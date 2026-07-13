/**
 * DocumentController - Camada de entrada HTTP
 *
 * Responsável por:
 * - Validar requisições HTTP
 * - Delegar para serviços
 * - Formatar respostas (sucesso e erro)
 * - Lidar com arquivo do multer
 */

const fs = require('fs');

class DocumentController {
  constructor(documentService) {
    this.service = documentService;
  }

  /**
   * POST /api/upload
   * Fazer upload de um documento
   */
  async upload(req, res) {
    try {
      // Multer coloca o arquivo em req.file
      const file = req.file;
      const owner = req.body.owner;

      // Chamar serviço de upload
      const result = this.service.uploadDocument(file, owner);

      if (!result.success) {
        // Se há erro, deletar arquivo já enviado
        if (file && file.path) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('Erro ao deletar arquivo temporário:', err.message);
          }
        }

        // Mapear código de erro para status HTTP
        let status = 400;
        if (result.error.code === 'FILE_TOO_LARGE') {
          status = 413;
        }

        return res.status(status).json({
          success: false,
          error: result.error
        });
      }

      // Sucesso: 201 Created
      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error.message);
      
      // Deletar arquivo se houver erro durante processamento
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Erro ao deletar arquivo:', err.message);
        }
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Erro ao fazer upload do arquivo. Tente novamente mais tarde.'
        }
      });
    }
  }

  /**
   * GET /api/documents
   * Listar documentos com filtro opcional
   */
  async list(req, res) {
    try {
      const owner = req.query.owner;

      // Chamar serviço de listagem
      const result = this.service.listDocuments(owner);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      // Sucesso: 200 OK
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Erro ao listar documentos:', error.message);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: 'Erro ao listar documentos. Tente novamente mais tarde.'
        }
      });
    }
  }

  /**
   * GET /api/documents/:id/download
   * Fazer download de um documento
   */
  async download(req, res) {
    try {
      const id = req.params.id;

      // Chamar serviço para buscar documento
      const result = this.service.downloadDocument(id);

      if (!result.success) {
        const status = result.error.code === 'DOCUMENT_NOT_FOUND' ? 404 : 400;
        return res.status(status).json({
          success: false,
          error: result.error
        });
      }

      const document = result.data;
      const filePath = this.service.repository.getFilePath(document.storageName);

      // Validar se arquivo existe no disco
      if (!fs.existsSync(filePath)) {
        console.error(`Arquivo não encontrado no disco: ${filePath}`);
        return res.status(500).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND_ON_DISK',
            message: 'Arquivo não encontrado no servidor. Tente novamente mais tarde.'
          }
        });
      }

      // Configurar headers de resposta
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Length', document.size);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(document.originalName)}"`
      );

      // Enviar arquivo
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('Erro ao ler arquivo:', error.message);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              code: 'READ_ERROR',
              message: 'Erro ao ler o arquivo. Tente novamente mais tarde.'
            }
          });
        }
      });
    } catch (error) {
      console.error('Erro ao fazer download:', error.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: {
            code: 'DOWNLOAD_ERROR',
            message: 'Erro ao fazer download do arquivo. Tente novamente mais tarde.'
          }
        });
      }
    }
  }
}

module.exports = DocumentController;
