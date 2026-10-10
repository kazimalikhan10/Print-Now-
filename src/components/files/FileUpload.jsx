import { useEffect, useRef, useState } from 'react';
import { Camera, FolderOpen, UploadCloud } from 'lucide-react';
import Button from '../ui/Button';
import { formatBytes, MAX_FILE_SIZE } from '../../utils';

export default function FileUpload({ onFiles, errors = [], disabled = false, uploading = false, uploadFiles = [], openPicker = null }) {
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (disabled || uploading || !openPicker) return;
    const timer = window.setTimeout(() => {
      if (openPicker === 'camera') cameraInputRef.current?.click();
      else inputRef.current?.click();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [disabled, uploading, openPicker]);

  const handleSelection = (fileList) => {
    if (disabled || uploading) return;
    onFiles(Array.from(fileList || []));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    handleSelection(event.dataTransfer.files);
  };

  return (
    <div>
      {uploading && (
        <div className="mb-3 overflow-hidden rounded-[16px] border border-[#dfe2ef] bg-white shadow-[0_8px_24px_rgba(28,31,57,0.05)]" role="status" aria-live="polite">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="pn-upload-spinner h-5 w-5 shrink-0 rounded-full border-2 border-[#dcd9ff] border-t-[#4a43e8]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <strong className="block text-[.74rem] font-[750] text-[#202332]">Adding files…</strong>
              <span className="mt-0.5 block text-[.62rem] text-[#7b8294]">Preparing your files. Large files may take a little longer.</span>
            </div>
          </div>
          <div className="pn-upload-progress h-1 overflow-hidden bg-[#eeedff]"><span className="block h-full w-1/3 rounded-full bg-[#4a43e8]" /></div>
          {uploadFiles.length > 0 && (
            <div className="border-t border-[#f0f1f5] px-4 py-2.5">
              <div className="flex flex-col gap-1.5">
                {uploadFiles.map((file) => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex min-w-0 items-center gap-2 text-[.62rem] text-[#6f7687]">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4a43e8]" aria-hidden="true" />
                    <span className="truncate">{file.name}</span>
                    <span className="ml-auto shrink-0 text-[#9a9fad]">Preparing</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        className={`flex flex-col items-center rounded-[17px] border-[1.5px] border-dashed px-[18px] pb-[25px] pt-7 text-center transition ${dragging ? 'border-[#4a43e8] bg-[#eeedff] shadow-[inset_0_0_0_2px_#aaa6ff]' : 'border-[#9e9aff] bg-gradient-to-b from-[#fbfbff] to-[#f4f5ff]'}`}
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
        <div className="mb-3 grid h-[62px] w-[62px] place-items-center rounded-[18px] bg-[#e9e9ff] text-[#4b43ed]"><UploadCloud size={38} /></div>
        <h2>{dragging ? 'Drop your files here' : 'Upload Files'}</h2>
        <p>Choose documents or photos from your device.</p>
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>
          Select Files
        </Button>
        <small>PDF, JPG, PNG, DOC, DOCX · Up to 20 MB per file</small>
        <span className="mt-2 block text-[.64rem] text-[#81879a]">On desktop, you can also drag and drop files here.</span>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 flex flex-col gap-1 rounded-xl bg-[#fff2f2] p-3 text-[.72rem] text-[#c23838]" role="alert">
          <strong>Some files couldn't be added</strong>
          {errors.map((error) => <span key={error}>{error}</span>)}
        </div>
      )}

      <div className="my-[22px] flex items-center gap-3 text-[.74rem] text-[#858b9b] before:h-px before:flex-1 before:bg-[#e4e7ef] after:h-px after:flex-1 after:bg-[#e4e7ef]"><span>Or take a photo</span></div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex min-h-[78px] flex-col items-center justify-center gap-[7px] rounded-[14px] border border-[#e4e7ef] bg-white text-[#333a4b]">
          <input ref={cameraInputRef} className="absolute h-px w-px pointer-events-none opacity-0" type="file" accept="image/*" capture="environment" onChange={(event) => { handleSelection(event.target.files); event.target.value = ''; }} />
          <Camera size={24} />
          <span>Camera</span>
        </label>
        <label className="flex min-h-[78px] flex-col items-center justify-center gap-[7px] rounded-[14px] border border-[#e4e7ef] bg-white text-[#333a4b]">
          <input className="absolute h-px w-px pointer-events-none opacity-0" type="file" accept="image/*" onChange={(event) => { handleSelection(event.target.files); event.target.value = ''; }} />
          <FolderOpen size={24} />
          <span>Gallery</span>
        </label>
      </div>

      <p className="mt-3 text-center text-[.68rem] leading-[1.45] text-[#7f8698]">Maximum file size: {formatBytes(MAX_FILE_SIZE)}. You can add multiple files in one order.</p>
    </div>
  );
}
