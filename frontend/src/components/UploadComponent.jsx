import { useState } from 'react';
import { uploadDocument } from '../services/documentService';

export default function UploadComponent({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setStatus({ type: 'error', message: 'Selecione um arquivo.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const document = await uploadDocument(file, owner);
      setStatus({ type: 'success', message: `"${document.originalName}" enviado com sucesso.` });
      setFile(null);
      setOwner('');
      e.target.reset();
      if (onUploadSuccess) onUploadSuccess(document);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={styles.section}>
      <h2>Enviar documento</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Arquivo
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
            style={styles.input}
            disabled={loading}
          />
        </label>
        <label style={styles.label}>
          Proprietário (opcional)
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Ex: joao"
            style={styles.input}
            disabled={loading}
          />
        </label>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Enviando…' : 'Enviar'}
        </button>
      </form>
      {status && (
        <p style={status.type === 'success' ? styles.success : styles.error}>
          {status.message}
        </p>
      )}
    </section>
  );
}

const styles = {
  section: { marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '400px' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' },
  input: { padding: '0.4rem', fontSize: '1rem' },
  button: { padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '1rem', alignSelf: 'flex-start' },
  success: { color: '#2e7d32' },
  error: { color: '#c62828' },
};
