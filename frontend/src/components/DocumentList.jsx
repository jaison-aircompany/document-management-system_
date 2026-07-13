import { useState, useEffect, useCallback } from 'react';
import { listDocuments } from '../services/documentService';
import DownloadButton from './DownloadButton';

export default function DocumentList({ refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDocuments();
      setDocuments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  return (
    <section>
      <div style={styles.header}>
        <h2>Documentos</h2>
        <button onClick={fetchDocuments} disabled={loading} style={styles.refreshBtn}>
          {loading ? 'Carregando…' : 'Atualizar'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <p style={styles.empty}>Nenhum documento encontrado.</p>
      )}

      {documents.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Tamanho</th>
              <th style={styles.th}>Proprietário</th>
              <th style={styles.th}>Data</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} style={styles.row}>
                <td style={styles.td}>{doc.originalName}</td>
                <td style={styles.td}>{formatBytes(doc.size)}</td>
                <td style={styles.td}>{doc.owner || '—'}</td>
                <td style={styles.td}>{new Date(doc.uploadedAt).toLocaleString('pt-BR')}</td>
                <td style={styles.td}>
                  <DownloadButton id={doc.id} fileName={doc.originalName} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: '1rem' },
  refreshBtn: { padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' },
  error: { color: '#c62828' },
  empty: { color: '#555' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th: { textAlign: 'left', borderBottom: '2px solid #ddd', padding: '0.5rem 0.75rem' },
  td: { padding: '0.5rem 0.75rem', borderBottom: '1px solid #eee' },
  row: {},
};
