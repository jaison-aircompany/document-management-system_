import { downloadUrl } from '../services/documentService';

export default function DownloadButton({ id, fileName }) {
  return (
    <a href={downloadUrl(id)} download={fileName} style={styles.link}>
      Baixar
    </a>
  );
}

const styles = {
  link: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    border: '1px solid #1565c0',
    borderRadius: '4px',
    color: '#1565c0',
    textDecoration: 'none',
    fontSize: '0.85rem',
  },
};
