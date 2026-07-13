/**
 * DocumentRepository - Camada de persistência
 *
 * Responsável por:
 * - Armazenar metadados de documentos em memória (array)
 * - Fornecer métodos de busca (findAll, findById, findByOwner)
 * - Integração com filesystem para deletar arquivos
 */

const fs = require('fs');
const path = require('path');

class DocumentRepository {
  constructor(storageDir = './storage') {
    // Array em memória para armazenar metadados dos documentos
    this.documents = [];
    this.storageDir = storageDir;

    // Criar diretório de storage se não existir
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Armazena metadados de um novo documento
   * @param {Object} document - Objeto com id, originalName, storageName, size, mimeType, uploadedAt, owner
   * @returns {Object} Documento armazenado
   */
  create(document) {
    this.documents.push(document);
    return document;
  }

  /**
   * Retorna todos os documentos
   * @returns {Array} Array de documentos ordenados por uploadedAt descendente
   */
  findAll() {
    return this.documents
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  /**
   * Busca documento por ID
   * @param {string} id - ID do documento
   * @returns {Object|null} Documento ou null se não encontrado
   */
  findById(id) {
    return this.documents.find(doc => doc.id === id) || null;
  }

  /**
   * Retorna documentos de um proprietário específico
   * @param {string} owner - ID do proprietário
   * @returns {Array} Array de documentos do owner ordenados por uploadedAt descendente
   */
  findByOwner(owner) {
    return this.documents
      .filter(doc => doc.owner === owner)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  }

  /**
   * Deleta arquivo do filesystem
   * @param {string} storageName - Nome do arquivo gravado (ex: uuid.pdf)
   * @returns {boolean} true se deletado, false se erro
   */
  deleteFile(storageName) {
    const filePath = path.join(this.storageDir, storageName);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erro ao deletar arquivo ${storageName}:`, error.message);
      return false;
    }
  }

  /**
   * Retorna o caminho completo de um arquivo no storage
   * @param {string} storageName - Nome do arquivo
   * @returns {string} Caminho completo
   */
  getFilePath(storageName) {
    return path.join(this.storageDir, storageName);
  }
}

module.exports = DocumentRepository;
