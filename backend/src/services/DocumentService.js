/**
 * DocumentService - Camada de negócio
 *
 * Responsável por:
 * - Validar uploads (tipo MIME, tamanho)
 * - Orquestrar upload, download, listagem
 * - Gerar IDs únicos para documentos
 * - Tratamento de regras de negócio
 */

const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
};

// Tamanho máximo em bytes (50MB)
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 52428800;

class DocumentService {
  constructor(documentRepository) {
    this.repository = documentRepository;
  }

  /**
   * Valida se o tipo MIME é permitido
   * @param {string} mimeType - Tipo MIME do arquivo
   * @returns {boolean} true se permitido
   */
  isAllowedMimeType(mimeType) {
    return mimeType in ALLOWED_MIME_TYPES;
  }

  /**
   * Extrai extensão do tipo MIME
   * @param {string} mimeType - Tipo MIME
   * @returns {string} Extensão (ex: 'pdf')
   */
  getExtensionFromMimeType(mimeType) {
    return ALLOWED_MIME_TYPES[mimeType] || 'bin';
  }

  /**
   * Valida se tamanho está dentro do limite
   * @param {number} size - Tamanho em bytes
   * @returns {boolean} true se válido
   */
  isValidFileSize(size) {
    return size > 0 && size <= MAX_FILE_SIZE;
  }

  /**
   * Gera nome sanitizado para armazenamento
   * @param {string} originalName - Nome original do arquivo
   * @param {string} extension - Extensão desejada
   * @returns {string} Nome sanitizado (uuid.ext)
   */
  generateStorageName(originalName, extension) {
    const id = uuidv4();
    return `${id}.${extension}`;
  }

  /**
   * Upload de documento
   * @param {Object} file - Objeto multer com buffer e originalname
   * @param {string} owner - ID do proprietário
   * @returns {Object} Documento criado ou erro
   */
  uploadDocument(file, owner) {
    // Validação de presença de arquivo
    if (!file) {
      return {
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'Arquivo é obrigatório'
        }
      };
    }

    // Validação de owner
    if (!owner || owner.trim() === '') {
      return {
        success: false,
        error: {
          code: 'MISSING_OWNER',
          message: 'Identificador do proprietário é obrigatório'
        }
      };
    }

    // Validação de tipo MIME
    if (!this.isAllowedMimeType(file.mimetype)) {
      const allowedTypes = Object.keys(ALLOWED_MIME_TYPES)
        .map(mt => ALLOWED_MIME_TYPES[mt])
        .join(', ');
      return {
        success: false,
        error: {
          code: 'FILE_TYPE_NOT_ALLOWED',
          message: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes}`
        }
      };
    }

    // Validação de tamanho
    if (!this.isValidFileSize(file.size)) {
      const maxSizeMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Arquivo excede o tamanho máximo de ${maxSizeMB}MB`,
          details: `Tamanho do arquivo: ${Math.round(file.size / 1024 / 1024)}MB`
        }
      };
    }

    // Gerar metadados do documento
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const storageName = this.generateStorageName(file.originalname, extension);
    const id = storageName.split('.')[0]; // UUID é o prefixo do storageName

    const document = {
      id,
      originalName: file.originalname,
      storageName,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      owner: owner.trim()
    };

    // Armazenar metadados no repositório
    this.repository.create(document);

    return {
      success: true,
      data: document
    };
  }

  /**
   * Listar documentos com filtro opcional
   * @param {string} owner - ID do proprietário (opcional)
   * @returns {Object} Array de documentos ou erro
   */
  listDocuments(owner) {
    // Se owner é fornecido mas vazio, retornar erro
    if (owner !== undefined && owner !== null && owner.trim() === '') {
      return {
        success: false,
        error: {
          code: 'INVALID_FILTER',
          message: "Parâmetro 'owner' não pode estar vazio"
        }
      };
    }

    let documents;
    if (owner) {
      documents = this.repository.findByOwner(owner.trim());
    } else {
      documents = this.repository.findAll();
    }

    return {
      success: true,
      data: documents
    };
  }

  /**
   * Download de documento
   * @param {string} id - ID do documento
   * @returns {Object} Documento encontrado ou erro
   */
  downloadDocument(id) {
    // Validação de ID
    if (!id || !this.isValidUuid(id)) {
      return {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'ID do documento inválido'
        }
      };
    }

    const document = this.repository.findById(id);
    if (!document) {
      return {
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Documento não encontrado'
        }
      };
    }

    return {
      success: true,
      data: document
    };
  }

  /**
   * Valida formato UUID v4
   * @param {string} uuid - UUID a validar
   * @returns {boolean} true se UUID válido
   */
  isValidUuid(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

module.exports = DocumentService;
