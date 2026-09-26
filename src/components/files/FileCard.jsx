import { FileText, Image as ImageIcon, Settings2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { formatBytes } from '../../utils';

export default function FileCard({ file, onConfigure, onDelete }) {
  const isPhoto = file.type === 'photo';

  return (
    <article className="flex gap-3 rounded-2xl border border-[#e7e9f0] bg-white p-3.5">
      {isPhoto && file.preview ? (
        <div className="h-[52px] w-12 flex-none overflow-hidden rounded-[11px] bg-[#eef0ff]"><img className="block h-full w-full object-cover" src={file.preview} alt="" /></div>
      ) : (
        <div className="grid h-12 w-[43px] flex-none place-items-center rounded-[11px] bg-[#fff0f0] text-[#e33e3e]"><FileText size={22} /></div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-[7px]">
          <strong className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[.83rem] text-[#171a24]">{file.name}</strong>
          {file.configured && <span className="flex-none rounded-full bg-[#e9f8ef] px-[7px] py-[3px] text-[.58rem] font-bold text-[#16884a]">Ready</span>}
        </div>
        <span className="mt-[3px] block text-[.67rem] text-[#777f91]">{isPhoto ? 'Photo' : `${file.pages} pages`} · {formatBytes(file.size)}</span>
        <div className="mt-2.5 flex items-center gap-1.5">
          <Button variant="outline" onClick={onConfigure}><Settings2 size={15} /> {file.configured ? 'Edit' : 'Configure'}</Button>
          <button className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#eceef3] bg-white text-[#e44848] transition hover:bg-[#fff7f7]" onClick={onDelete} aria-label={`Delete ${file.name}`}><Trash2 size={18} /></button>
        </div>
      </div>
    </article>
  );
}
