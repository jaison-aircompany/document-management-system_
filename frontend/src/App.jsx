import { useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleUploadSuccess() {
    setRefreshTrigger((prev) => prev + 1);
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Document Management System</h1>
      <hr style={{ marginBottom: '1.5rem' }} />
      <UploadComponent onUploadSuccess={handleUploadSuccess} />
      <DocumentList refreshTrigger={refreshTrigger} />
    </main>
  );
}
