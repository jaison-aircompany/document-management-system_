# Especificação - Document Management System (DMS)

**Versão**: 1.0  
**Data**: 2026-07-13  
**Status**: Especificação Completa

---

## 1. Objetivo

Construir um sistema web para gerenciamento de documentos que permita aos usuários enviar, listar e baixar arquivos com armazenamento local simples, validações básicas e metadados em memória.

---

## 2. Escopo

### Dentro do escopo

- ✅ Upload de documentos via formulário multipart
- ✅ Listagem de documentos com metadados
- ✅ Download de documentos pelo identificador
- ✅ Gestão simples por usuário (identificador do dono)
- ✅ Armazenamento local no filesystem via multer
- ✅ Metadados em memória nesta fase
- ✅ Validações básicas (tipo de arquivo, tamanho máximo)
- ✅ Tratamento de erros com mensagens claras

### Fora do escopo

- ❌ Armazenamento em nuvem (S3, Azure, etc.)
- ❌ Autenticação e autorização complexa
- ❌ Versionamento de documentos
- ❌ Compartilhamento de documentos entre usuários
- ❌ Busca avançada ou indexação
- ❌ Persistência em banco de dados

---

## 3. Requisitos Funcionais

| ID    | Requisito | Descrição | Critérios de Aceitação |
|-------|-----------|-----------|------------------------|
| **RF-01** | O usuário pode enviar um documento | Upload de arquivo via formulário multipart | ✓ Arquivo salvo em `backend/storage/`<br/>✓ Metadados armazenados em memória<br/>✓ ID único gerado (UUID)<br/>✓ Status 201 Created retornado<br/>✓ Resposta inclui metadados do documento |
| **RF-02** | O usuário pode listar os documentos enviados | Listagem de todos os documentos do usuário | ✓ Lista retorna array de metadados<br/>✓ Ordenação por data de upload (descendente)<br/>✓ Status 200 OK retornado<br/>✓ Suporta filtro opcional por owner |
| **RF-03** | O usuário pode baixar um documento | Download do arquivo pelo ID | ✓ Arquivo retornado com tipo MIME correto<br/>✓ Header Content-Disposition retorna nome original<br/>✓ Status 200 OK<br/>✓ Status 404 se documento não encontrado |
| **RF-04** | O sistema valida tipo de arquivo | Rejeita arquivos não permitidos | ✓ Apenas extensões permitidas (vide RNF-04)<br/>✓ Status 400 Bad Request<br/>✓ Mensagem de erro clara |
| **RF-05** | O sistema valida tamanho de arquivo | Rejeita arquivos muito grandes | ✓ Tamanho máximo: 50MB (vide RNF-05)<br/>✓ Status 413 Payload Too Large<br/>✓ Mensagem de erro com limite |
| **RF-06** | O sistema retorna erro se documento não existe | Download/acesso de documento inexistente | ✓ Status 404 Not Found<br/>✓ Mensagem JSON de erro<br/>✓ Log da tentativa |
| **RF-07** | O sistema trata erros de I/O | Falha no armazenamento de arquivo | ✓ Status 500 Internal Server Error<br/>✓ Mensagem genérica ao cliente<br/>✓ Log detalhado do erro |
| **RF-08** | O sistema trata requisições inválidas | Falta arquivo ou parâmetros | ✓ Status 400 Bad Request<br/>✓ Mensagem clara do que está faltando |

---

## 4. Requisitos Não-Funcionais

| ID     | Requisito | Descrição |
|--------|-----------|-----------|
| **RNF-01** | Armazenamento local | Arquivos salvos em `backend/storage/` usando multer diskStorage |
| **RNF-02** | Metadados em memória | Documentos armazenados em array/map JavaScript durante a sessão |
| **RNF-03** | Configuração via ambiente | Variáveis de ambiente para porta, limite de tamanho, diretório de storage |
| **RNF-04** | Tipos permitidos | `.pdf`, `.doc`, `.docx`, `.txt`, `.jpg`, `.png`, `.xlsx` |
| **RNF-05** | Tamanho máximo | 50MB por arquivo |
| **RNF-06** | Clean Architecture | Separação clara em routes, controllers, services, repositories |
| **RNF-07** | JavaScript puro | Sem TypeScript; sem overengineering |
| **RNF-08** | Mensagens em português | Interface traduzida para usuário; código em inglês |

---

## 5. Modelo de Dados

### Document (Metadados)

```javascript
{
  id: string,              // UUID v4, ex: "550e8400-e29b-41d4-a716-446655440000"
  originalName: string,    // Nome do arquivo no upload, ex: "relatorio.pdf"
  storageName: string,     // Nome salvo no filesystem, ex: "550e8400-e29b-41d4-a716-446655440000.pdf"
  size: number,            // Tamanho em bytes, ex: 1048576
  mimeType: string,        // Tipo MIME, ex: "application/pdf"
  uploadedAt: string,      // ISO 8601, ex: "2026-07-13T14:30:00.000Z"
  owner: string            // ID do usuário dono, ex: "user123"
}
```

### Validações e Constraints

| Campo | Validação | Descrição |
|-------|-----------|-----------|
| `id` | UUID v4 único | Gerado automaticamente no upload |
| `originalName` | 1-255 caracteres, sem "/" | Nome sanitizado |
| `storageName` | UUID + extensão original | Formato: `{uuid}.{ext}` |
| `size` | 1 - 52428800 bytes | Mínimo 1 byte, máximo 50MB |
| `mimeType` | Whitelist permitida | Vide RNF-04 |
| `uploadedAt` | ISO 8601 válido | Gerado no servidor |
| `owner` | 1-50 caracteres | Identificador do usuário |

### Erro (Response)

```javascript
{
  success: false,
  error: {
    code: string,       // Ex: "FILE_TOO_LARGE"
    message: string,    // Ex: "Arquivo excede o tamanho máximo de 50MB"
    details: string     // Opcional, ex: "Tamanho do arquivo: 75MB"
  }
}
```

### Sucesso (Response)

```javascript
{
  success: true,
  data: Document | Document[] | Buffer  // Depende do endpoint
}
```

---

## 6. Contratos de API

### Base

- **Host**: `http://localhost:3000` (produção: variável de ambiente)
- **Prefixo**: `/api`
- **Content-Type**: `application/json` (exceto uploads e downloads)

---

### 6.1 POST /api/upload

**Descrição**: Enviar um novo documento.

#### Request

```
POST /api/upload HTTP/1.1
Host: localhost:3000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="relatorio.pdf"
Content-Type: application/pdf

[arquivo binário]
------WebKitFormBoundary
Content-Disposition: form-data; name="owner"

user123
------WebKitFormBoundary--
```

#### Query Parameters (Opcionais)

Nenhum nesta versão.

#### Body

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `file` | binary | Sim | Arquivo para upload (multipart field) |
| `owner` | string | Sim | Identificador do usuário dono |

#### Validações

- ✓ Campo `file` deve estar presente
- ✓ Campo `owner` deve estar presente e não vazio
- ✓ Tipo MIME do arquivo deve estar na whitelist (RNF-04)
- ✓ Tamanho do arquivo ≤ 50MB (RNF-05)

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "storageName": "550e8400-e29b-41d4-a716-446655440000.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-07-13T14:30:00.000Z",
    "owner": "user123"
  }
}
```

#### Responses (Erro)

**400 Bad Request** – Campo obrigatório faltando
```json
{
  "success": false,
  "error": {
    "code": "MISSING_FILE",
    "message": "Arquivo é obrigatório"
  }
}
```

**400 Bad Request** – Tipo de arquivo não permitido
```json
{
  "success": false,
  "error": {
    "code": "FILE_TYPE_NOT_ALLOWED",
    "message": "Tipo de arquivo não permitido. Tipos aceitos: pdf, doc, docx, txt, jpg, png, xlsx"
  }
}
```

**413 Payload Too Large** – Arquivo excede tamanho máximo
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Arquivo excede o tamanho máximo de 50MB",
    "details": "Tamanho do arquivo: 75MB"
  }
}
```

**500 Internal Server Error** – Erro no armazenamento
```json
{
  "success": false,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Erro ao armazenar o arquivo. Tente novamente mais tarde."
  }
}
```

---

### 6.2 GET /api/documents

**Descrição**: Listar todos os documentos (opcionalmente filtrar por usuário).

#### Request

```
GET /api/documents?owner=user123 HTTP/1.1
Host: localhost:3000
```

#### Query Parameters (Opcionais)

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `owner` | string | Filtrar documentos por identificador do dono (opcional) |

#### Validações

- ✓ Se `owner` fornecido, deve ser não vazio

#### Response (200 OK)

**Sem filtro** (retorna todos os documentos):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "storageName": "550e8400-e29b-41d4-a716-446655440000.pdf",
      "size": 1048576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-07-13T14:30:00.000Z",
      "owner": "user123"
    },
    {
      "id": "660f9511-f40c-52e5-b827-557766551111",
      "originalName": "apresentacao.pptx",
      "storageName": "660f9511-f40c-52e5-b827-557766551111.pptx",
      "size": 2097152,
      "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "uploadedAt": "2026-07-12T10:15:00.000Z",
      "owner": "user456"
    }
  ]
}
```

**Com filtro** (retorna documentos do usuário):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "storageName": "550e8400-e29b-41d4-a716-446655440000.pdf",
      "size": 1048576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-07-13T14:30:00.000Z",
      "owner": "user123"
    }
  ]
}
```

#### Responses (Erro)

**400 Bad Request** – Parâmetro inválido
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILTER",
    "message": "Parâmetro 'owner' não pode estar vazio"
  }
}
```

---

### 6.3 GET /api/documents/:id/download

**Descrição**: Baixar um documento pelo seu ID.

#### Request

```
GET /api/documents/550e8400-e29b-41d4-a716-446655440000/download HTTP/1.1
Host: localhost:3000
```

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | Identificador único do documento (UUID) |

#### Validações

- ✓ ID deve ser um UUID válido
- ✓ Documento com esse ID deve existir

#### Response (200 OK)

```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 1048576
Content-Disposition: attachment; filename="relatorio.pdf"
Cache-Control: no-cache, no-store, must-revalidate

[arquivo binário]
```

**Headers importantes**:
- `Content-Type`: Tipo MIME correto do arquivo
- `Content-Length`: Tamanho do arquivo em bytes
- `Content-Disposition`: `attachment; filename="<originalName>"`

#### Responses (Erro)

**400 Bad Request** – ID inválido
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ID",
    "message": "ID do documento inválido"
  }
}
```

**404 Not Found** – Documento não encontrado
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado"
  }
}
```

**500 Internal Server Error** – Erro ao ler arquivo
```json
{
  "success": false,
  "error": {
    "code": "READ_ERROR",
    "message": "Erro ao ler o arquivo. Tente novamente mais tarde."
  }
}
```

---

## 7. Fluxos de Negócio

### 7.1 Fluxo de Upload

```
1. Usuário submete arquivo via formulário multipart
   ↓
2. Controller recebe request e valida presença de arquivo e owner
   ├─ Se faltando: retorna 400 com mensagem
   └─ Se OK: passa para Service
   ↓
3. Service valida tipo MIME (whitelist RNF-04)
   ├─ Se inválido: retorna erro 400
   └─ Se OK: continua
   ↓
4. Service valida tamanho (máximo 50MB)
   ├─ Se muito grande: retorna erro 413
   └─ Se OK: continua
   ↓
5. Repository salva arquivo no filesystem usando multer
   ├─ Se erro de I/O: retorna erro 500
   └─ Se OK: gera ID único (UUID)
   ↓
6. Repository armazena metadados em memória
   ├─ Se erro: retorna erro 500
   └─ Se OK: continua
   ↓
7. Controller retorna 201 Created com metadados do documento
```

### 7.2 Fluxo de Listagem

```
1. Usuário requisita GET /api/documents (com ou sem filtro owner)
   ↓
2. Controller valida query parameters
   ├─ Se owner vazio: retorna 400
   └─ Se OK: passa para Service
   ↓
3. Service recupera documentos em memória
   ├─ Se sem filtro: retorna todos os documentos
   └─ Se com filtro owner: retorna apenas documentos desse owner
   ↓
4. Service ordena por uploadedAt descendente (mais recentes primeiro)
   ↓
5. Controller retorna 200 OK com array de metadados
```

### 7.3 Fluxo de Download

```
1. Usuário requisita GET /api/documents/:id/download
   ↓
2. Controller valida ID (deve ser UUID válido)
   ├─ Se inválido: retorna 400
   └─ Se OK: passa para Service
   ↓
3. Service busca documento em memória por ID
   ├─ Se não encontrado: retorna 404
   └─ Se encontrado: continua
   ↓
4. Repository lê arquivo do filesystem
   ├─ Se arquivo não existe no disco: retorna 500
   ├─ Se erro de leitura: retorna 500
   └─ Se OK: retorna buffer
   ↓
5. Controller configura headers corretos:
   - Content-Type: mimeType do documento
   - Content-Length: size do documento
   - Content-Disposition: attachment; filename="originalName"
   ↓
6. Controller retorna 200 OK com arquivo binário
```

### 7.4 Cenários de Erro

| Cenário | Trigger | Resposta | HTTP Status |
|---------|---------|----------|-------------|
| Arquivo faltando | POST /upload sem file | Mensagem de validação | 400 |
| Tipo não permitido | Upload de .exe | Mensagem de tipo inválido | 400 |
| Arquivo muito grande | Upload de 100MB | Mensagem de limite | 413 |
| Owner vazio | POST /upload owner="" | Mensagem owner obrigatório | 400 |
| ID inválido | GET /documents/abc/download | Mensagem de ID inválido | 400 |
| Doc não encontrado | GET /documents/uuid-fake/download | Mensagem not found | 404 |
| Erro de I/O | Disco cheio | Erro genérico | 500 |
| Arquivo deletado | Doc em memória, arquivo deletado do disco | Erro genérico | 500 |

---

## 8. Decisões Arquiteturais

### 8.1 Clean Architecture Simples

A aplicação backend segue uma arquitetura em camadas clara:

- **Routes** (`routes/`): Definem endpoints do Express e delegam para controllers
- **Controllers** (`controllers/`): Tratam requisições HTTP, validação básica e respostas
- **Services** (`services/`): Concentram regras de negócio (upload, download, listagem)
- **Repositories** (`repositories/`): Cuidam de persistência (filesystem + memória)

**Fluxo de dependência**: `Routes → Controllers → Services → Repositories`

### 8.2 Armazenamento Local com Multer

- Arquivos salvos em `backend/storage/` usando `multer.diskStorage()`
- Naming: `{uuid}.{extensão_original}` para evitar conflitos
- Metadados armazenados em array/map JavaScript em memória
- Sem conexão com banco de dados (escopo futuro)

### 8.3 Sem TypeScript

Código em JavaScript puro (CommonJS no backend, ESM no frontend) para simplicidade e velocidade de desenvolvimento. Tipos implícitos através de comentários JSDoc quando necessário.

### 8.4 Frontend em Componentes React

- Componentes funcionais com React Hooks
- Organização: `components/`, `pages/`, `services/`
- Comunicação com backend via `fetch` com proxy configurado no Vite

### 8.5 Configuração via Variáveis de Ambiente

Segue 12-Factor App:
- `PORT` – Porta do servidor (default: 3000)
- `MAX_FILE_SIZE` – Limite de tamanho em bytes (default: 52428800 = 50MB)
- `STORAGE_DIR` – Diretório de armazenamento (default: ./storage)

### 8.6 Tratamento de Erros nos Limites

Erros de entrada HTTP, leitura/escrita de arquivos e validação são tratados no nível de controller com respostas estruturadas.

---

## 9. Restrições e Considerações

### 9.1 Restrições Atuais

1. **Metadados em memória**: Documentos são perdidos ao reiniciar a aplicação
2. **Sem autenticação**: Qualquer um pode acessar qualquer documento (usar `owner` para simulação)
3. **Sem versionamento**: Cada upload é um documento novo
4. **Sem compartilhamento**: Cada usuário vê apenas seus próprios documentos (potencial melhoria)
5. **Storage local**: Não escala para múltiplas instâncias

### 9.2 Melhorias Futuras

1. **Persistência**: Migrar metadados para banco de dados (PostgreSQL, MongoDB)
2. **Autenticação**: JWT ou OAuth2 para identificar usuários
3. **Cloud Storage**: S3, Azure Blob ou similar para escalar
4. **Busca**: Índice de documentos, busca por nome, data, owner
5. **Versionamento**: Histórico de versões de documentos
6. **Compartilhamento**: Documentos compartilhados entre usuários com permissões

---

## 10. Plano de Execução em 7 Etapas

### **Etapa 1: Setup de Repositories (Camada de Dados)**

**Objetivo**: Criar a camada mais interna que simula persistência em memória e acesso ao filesystem.

**Arquivos a criar**:
- `backend/src/repositories/DocumentRepository.js` – Armazena e recupera metadados em memória

**Responsabilidades**:
- `create(document)` – Armazena novo documento na memória
- `findAll()` – Retorna todos os documentos
- `findById(id)` – Retorna documento por ID
- `findByOwner(owner)` – Retorna documentos de um usuário
- `deleteFile(storageName)` – Deleta arquivo do filesystem

**Dependências**:
- `fs` (Node.js nativo)
- `path` (Node.js nativo)

**Testes**:
- Armazenar e recuperar documento
- Filtrar por owner
- Deletar arquivo

---

### **Etapa 2: Setup de Services (Regras de Negócio)**

**Objetivo**: Implementar lógica de negócio isolada do HTTP.

**Arquivos a criar**:
- `backend/src/services/DocumentService.js` – Orquestra upload, download, listagem

**Responsabilidades**:
- `uploadDocument(file, owner)` – Valida e cria novo documento
- `listDocuments(owner?)` – Retorna documentos com opcional filtro
- `downloadDocument(id)` – Retorna arquivo para download
- Validações de tipo MIME, tamanho, etc.

**Dependências**:
- `DocumentRepository` (Etapa 1)
- `uuid` (gerar IDs únicos)
- `mime-types` (validar tipos MIME)

**Testes**:
- Validação de tipo MIME
- Validação de tamanho
- Geração de ID único

---

### **Etapa 3: Setup de Controllers (Validação HTTP)**

**Objetivo**: Lidar com entrada/saída HTTP e delegar para services.

**Arquivos a criar**:
- `backend/src/controllers/DocumentController.js` – Valida requests HTTP

**Responsabilidades**:
- `POST /upload` – Valida presença de file e owner, chama service
- `GET /documents` – Valida query params, chama service
- `GET /documents/:id/download` – Valida ID, chama service
- Formatação de respostas com `success` e `data`/`error`

**Dependências**:
- `DocumentService` (Etapa 2)

**Testes**:
- Validação de parâmetros
- Formatação de resposta
- Tratamento de erros

---

### **Etapa 4: Setup de Routes (Endpoints)**

**Objetivo**: Registrar endpoints do Express.

**Arquivos a criar**:
- `backend/src/routes/documentRoutes.js` – Define endpoints do Express

**Responsabilidades**:
- Registrar `POST /api/upload`
- Registrar `GET /api/documents`
- Registrar `GET /api/documents/:id/download`
- Configurar multer middleware

**Dependências**:
- `express` (já instalado)
- `multer` (já instalado)
- `DocumentController` (Etapa 3)

**Modificações**:
- Atualizar `backend/src/app.js` para importar e usar routes

**Testes**:
- Endpoints respondem no prefixo `/api`

---

### **Etapa 5: Frontend Básico (Componentes React)**

**Objetivo**: Criar interface simples para upload, listagem e download.

**Arquivos a criar**:
- `frontend/src/services/documentService.js` – Cliente HTTP para backend
- `frontend/src/components/DocumentUpload.jsx` – Formulário de upload
- `frontend/src/components/DocumentList.jsx` – Lista de documentos
- `frontend/src/pages/DocumentsPage.jsx` – Página principal

**Responsabilidades**:
- `documentService.upload(file, owner)` – POST /api/upload
- `documentService.list(owner?)` – GET /api/documents
- `documentService.download(id)` – GET /api/documents/:id/download
- Componentes React funcionais com Hooks
- Feedback ao usuário (loading, erros, sucesso)

**Dependências**:
- `react` (já instalado)
- `fetch` API

**Testes**:
- Componentes renderizam
- Comunicação com backend funciona

---

### **Etapa 6: Testes de Integração**

**Objetivo**: Validar fluxos completos end-to-end.

**Arquivos a criar/atualizar**:
- `backend/test/document.integration.test.js` – Testes de integração

**Testes a implementar**:
1. Upload com sucesso (201 Created, metadados retornados)
2. Upload sem arquivo (400 Bad Request)
3. Upload com tipo inválido (400 Bad Request)
4. Upload com arquivo muito grande (413 Payload Too Large)
5. Listagem de documentos (200 OK, array retornado)
6. Listagem filtrada por owner (200 OK, apenas documentos do owner)
7. Download de documento existente (200 OK, arquivo retornado)
8. Download de documento inexistente (404 Not Found)

**Dependências**:
- `node:test` (runner nativo)
- `assert` (nativo)
- `fs` (nativo)
- Servidor Express rodando em porta de teste

---

### **Etapa 7: Validação Final e Documentação**

**Objetivo**: Validar especificação contra implementação e documentar.

**Checklist**:
- ✓ Todos os 3 endpoints implementados
- ✓ Validações executadas conforme RF-04 a RF-08
- ✓ Armazenamento local em `backend/storage/`
- ✓ Metadados em memória
- ✓ Clean Architecture respeitada (4 camadas)
- ✓ Testes de integração passando
- ✓ Frontend básico funcional
- ✓ Tratamento de erros com mensagens em português
- ✓ Variáveis de ambiente configuráveis

**Arquivos a revisar**:
- `README.md` – Instruções de uso
- `backend/package.json` – Dependências corretas
- `frontend/package.json` – Dependências corretas
- Endpoints documentados e testáveis

**Manual de teste**:
1. Instalar dependências: `npm install` (backend e frontend)
2. Iniciar servidor: `npm start`
3. Iniciar frontend: `npm run dev`
4. Testar upload em http://localhost:5173
5. Testar listagem
6. Testar download
7. Verificar arquivos em `backend/storage/`
8. Executar testes: `npm test` (backend)

---

## 11. Conclusão

Esta especificação fornece um plano executável e verificável para construir o Document Management System. Cada etapa possui dependências claras, responsabilidades definidas e critérios de sucesso mensuráveis. O sistema respeita Clean Architecture, armazenamento local com multer, metadados em memória, e todas as convenções do projeto.

Próximo passo: Iniciar pela **Etapa 1** (Repositories).
