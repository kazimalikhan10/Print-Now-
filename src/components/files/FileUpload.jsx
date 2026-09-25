import { useRef, useState } from 'react';
import { Camera, FolderOpen, UploadCloud } from 'lucide-react';
import Button from '../ui/Button';
import { formatBytes, MAX_FILE_SIZE } from '../../utils';

export default function FileUpload({ onFiles, errors = [], disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleSelection = (fileList) => {
    if (disabled) return;
    onFiles(Array.from(fileList || []));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleSelection(event.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`upload-panel ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(event) => { handleSelection(event.target.files); event.target.value = ''; }}
          hidden
        />
        <div className="upload-icon"><UploadCloud size={38} /></div>
        <h2>{dragging ? 'Drop your files here' : 'Upload Files'}</h2>
        <p>Choose documents or photos from your device.</p>
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Select Files
        </Button>
        <small>PDF, JPG, PNG, DOC, DOCX · Up to 20 MB per file</small>
        <span className="upload-drop-hint">On desktop, you can also drag and drop files here.</span>
      </div>

      {errors.length > 0 && (
        <div className="upload-errors" role="alert">
          <strong>Some files couldn't be added</strong>
          {errors.map((error) => <span key={error}>{error}</span>)}
        </div>
      )}

      <div className="or-divider"><span>Or take a photo</span></div>
      <div className="capture-grid">
        <label className="capture-card">
          <input className="visually-hidden-input" type="file" accept="image/*" capture="environment" onChange={(event) => { handleSelection(event.target.files); event.target.value = ''; }} />
          <Camera size={24} />
          <span>Camera</span>
        </label>
        <label className="capture-card">
          <input className="visually-hidden-input" type="file" accept="image/*" onChange={(event) => { handleSelection(event.target.files); event.target.value = ''; }} />
          <FolderOpen size={24} />
          <span>Gallery</span>
        </label>
      </div>

      <p className="upload-footnote">Maximum file size: {formatBytes(MAX_FILE_SIZE)}. You can add multiple files in one order.</p>
    </div>
  );
}
