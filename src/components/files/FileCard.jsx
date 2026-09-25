import { FileText, Image as ImageIcon, Settings2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { formatBytes } from '../../utils';

export default function FileCard({ file, onConfigure, onDelete }) {
  const isPhoto = file.type === 'photo';

  return (
    <article className="file-card">
      {isPhoto && file.preview ? (
        <div className="file-thumb"><img src={file.preview} alt="" /></div>
      ) : (
        <div className="file-icon"><FileText size={22} /></div>
      )}
      <div className="file-info">
        <div className="file-title-row">
          <strong>{file.name}</strong>
          {file.configured && <span className="configured-badge">Ready</span>}
        </div>
        <span>{isPhoto ? 'Photo' : `${file.pages} pages`} · {formatBytes(file.size)}</span>
        <div className="file-actions">
          <Button variant="outline" onClick={onConfigure}><Settings2 size={15} /> {file.configured ? 'Edit' : 'Configure'}</Button>
          <button className="delete-button" onClick={onDelete} aria-label={`Delete ${file.name}`}><Trash2 size={18} /></button>
        </div>
      </div>
    </article>
  );
}
