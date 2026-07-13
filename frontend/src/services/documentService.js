const BASE = '/api';

async function handleResponse(response) {
  const body = await response.json();
  if (!response.ok) {
    const message = body?.error?.message || 'Erro desconhecido';
    throw new Error(message);
  }
  return body.data;
}

export async function uploadDocument(file, owner) {
  const form = new FormData();
  form.append('file', file);
  if (owner) form.append('owner', owner);

  const response = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  return handleResponse(response);
}

export async function listDocuments(owner) {
  const url = owner
    ? `${BASE}/documents?owner=${encodeURIComponent(owner)}`
    : `${BASE}/documents`;

  const response = await fetch(url);
  return handleResponse(response);
}

export function downloadUrl(id) {
  return `${BASE}/documents/${id}/download`;
}
