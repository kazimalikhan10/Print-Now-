import { useEffect, useMemo, useRef, useState } from 'react';
import { Crop, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { getPaperDimensions, getPhotoDimensions, getPhotoSheetLayout } from '../../utils/printPreview';
import PrintPagePreview from './PrintPagePreview';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const MIN_CROP = 0.08;

const defaultCropRect = () => ({ left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 });

const normalizeCropRect = (rect) => {
  const source = rect || defaultCropRect();

  const rawLeft = Number(source.left);
  const rawTop = Number(source.top);
  const rawRight = Number(source.right);
  const rawBottom = Number(source.bottom);

  const left = clamp(
    Number.isFinite(rawLeft) ? rawLeft : 0.05,0,1 - MIN_CROP
  );

  const top = clamp(
    Number.isFinite(rawTop) ? rawTop : 0.05,0,1 - MIN_CROP
  );

  const right = clamp(
    Number.isFinite(rawRight) ? rawRight : 0.95,left + MIN_CROP,1
  );

  const bottom = clamp(
    Number.isFinite(rawBottom) ? rawBottom : 0.95,top + MIN_CROP,1
  );

  return {
    left,top,right,bottom,
  };
};

export default function PhotoPrintPreview({ file, onChange }) {
  const imageStageRef = useRef(null);
  const dragRef = useRef(null);
  const editorRef = useRef(null);
  const [source, setSource] = useState({ width: 1, height: 1 });
  const [editor, setEditor] = useState({
    x: Number(file.options.crop?.x) || 0,
    y: Number(file.options.crop?.y) || 0,
    zoom: Number(file.options.crop?.zoom) || 1,
    rotation: ((Number(file.options.rotation) || 0) % 360 + 360) % 360,
    cropRect: normalizeCropRect(file.options.crop?.rect),
  });

  const paper = getPaperDimensions(file.options.paperSize || 'A4', file.options.orientation || 'portrait');
  const rotation = editor.rotation;
  const fit = file.options.fit || 'fill';
  const photo = getPhotoDimensions(file, source.width / Math.max(1, source.height));
  const frameWidth = clamp(photo.width, 10, paper.width);
  const frameHeight = clamp(photo.height, 10, paper.height);
  const frameLeft = (paper.width - frameWidth) / 2;
  const frameTop = (paper.height - frameHeight) / 2;
  const sheet = getPhotoSheetLayout(file);
  const copies = Math.max(1, Number(file.options.copies) || 1);
  const sheetsRequired = sheet.sheetsRequired || Math.max(1, Math.ceil(copies / Math.max(1, sheet.capacity)));
  const aspect = rotation % 180 === 0
    ? source.width / Math.max(1, source.height)
    : source.height / Math.max(1, source.width);
  const editorWidth = Math.min(430, Math.max(220, 420 * aspect));

  useEffect(() => {
    if (!file.preview) return undefined;
    const image = new Image();
    image.onload = () => setSource({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.src = file.preview;
    return undefined;
  }, [file.preview]);

  useEffect(() => {
    setEditor({
      x: Number(file.options.crop?.x) || 0,
      y: Number(file.options.crop?.y) || 0,
      zoom: clamp(Number(file.options.crop?.zoom) || 1, 1, 3),
      rotation: ((Number(file.options.rotation) || 0) % 360 + 360) % 360,
      cropRect: normalizeCropRect(file.options.crop?.rect),
    });
  }, [file.id, file.options.rotation, file.options.crop?.x, file.options.crop?.y, file.options.crop?.zoom, file.options.crop?.rect?.left, file.options.crop?.rect?.top, file.options.crop?.rect?.right, file.options.crop?.rect?.bottom]);

  const persistEditor = (next) => {
    onChange({
      crop: {
        x: next.x,
        y: next.y,
        zoom: next.zoom,
        rect: normalizeCropRect(next.cropRect),
      },
      rotation: next.rotation,
    });
  };

  editorRef.current = editor;

  const updateZoom = (value, persist = false) => {
    const next = { ...editor, zoom: clamp(Number(value), 1, 3) };
    setEditor(next);
    if (persist) persistEditor(next);
  };

  const reset = () => {
    const next = { x: 0, y: 0, zoom: 1, rotation: 0, cropRect: defaultCropRect() };
    setEditor(next);
    persistEditor(next);
  };

  const rotate = () => {
    const next = { ...editor, rotation: (editor.rotation + 90) % 360 };
    setEditor(next);
    persistEditor(next);
  };

  const beginCropInteraction = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = imageStageRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      mode,
      clientX: event.clientX,
      clientY: event.clientY,
      rect,
      cropRect: { ...editor.cropRect },
    };
  };

  const handleCropMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.clientX) / Math.max(1, drag.rect.width);
    const dy = (event.clientY - drag.clientY) / Math.max(1, drag.rect.height);
    const start = drag.cropRect;
    let next = { ...start };

    if (drag.mode === 'move') {
      const width = start.right - start.left;
      const height = start.bottom - start.top;
      next.left = clamp(start.left + dx, 0, 1 - width);
      next.right = next.left + width;
      next.top = clamp(start.top + dy, 0, 1 - height);
      next.bottom = next.top + height;
    } else {
      if (drag.mode.includes('left')) next.left = clamp(start.left + dx, 0, start.right - MIN_CROP);
      if (drag.mode.includes('right')) next.right = clamp(start.right + dx, start.left + MIN_CROP, 1);
      if (drag.mode.includes('top')) next.top = clamp(start.top + dy, 0, start.bottom - MIN_CROP);
      if (drag.mode.includes('bottom')) next.bottom = clamp(start.bottom + dy, start.top + MIN_CROP, 1);
    }

    setEditor((current) => ({ ...current, cropRect: next }));
  };

  const stopCropInteraction = () => {
    if (dragRef.current) persistEditor(editorRef.current);
    dragRef.current = null;
  };

  const cropPercent = useMemo(() => ({
    left: `${editor.cropRect.left * 100}%`,
    top: `${editor.cropRect.top * 100}%`,
    width: `${(editor.cropRect.right - editor.cropRect.left) * 100}%`,
    height: `${(editor.cropRect.bottom - editor.cropRect.top) * 100}%`,
  }), [editor.cropRect]);

  const cropStyle = {
    position: 'absolute',
    left: `${editor.cropRect.left * 100}%`,
    top: `${editor.cropRect.top * 100}%`,
    width: `${(editor.cropRect.right - editor.cropRect.left) * 100}%`,
    height: `${(editor.cropRect.bottom - editor.cropRect.top) * 100}%`,
  };

  const imageTransform = `translate(calc(-50% + ${editor.x}px), calc(-50% + ${editor.y}px)) rotate(${rotation}deg) scale(${editor.zoom})`;

  const renderCropHandle = (position, mode) => (
    <button
      key={position}
      type="button"
      aria-label={`Resize crop ${position}`}
      className={`absolute z-20 h-7 w-7 rounded-full border-2 border-white bg-[#4a43e8] shadow-[0_2px_8px_rgba(0,0,0,.28)] touch-none ${position === 'tl' ? '-left-3.5 -top-3.5 cursor-nwse-resize' : ''} ${position === 'tr' ? '-right-3.5 -top-3.5 cursor-nesw-resize' : ''} ${position === 'bl' ? '-bottom-3.5 -left-3.5 cursor-nesw-resize' : ''} ${position === 'br' ? '-bottom-3.5 -right-3.5 cursor-nwse-resize' : ''}`}
      onPointerDown={(event) => beginCropInteraction(event, mode)}
      onPointerMove={handleCropMove}
      onPointerUp={stopCropInteraction}
      onPointerCancel={stopCropInteraction}
    />
  );

  return (
    <section className="rounded-[18px] border border-[#e5e7ee] bg-white p-3.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span className="text-[.62rem] font-bold tracking-[.08em] text-[#4a43e8]">PHOTO EDITOR</span>
          <h2 className="mt-1 text-[1rem] font-bold text-[#202532]">Crop exactly what you want to print</h2>
          <p className="mt-1 text-[.68rem] leading-[1.45] text-[#7b8291]">Drag the crop box or any corner to select a specific part of the photo. Move and zoom the image only when you need to fine-tune it.</p>
        </div>
        <button type="button" className="inline-flex shrink-0 items-center gap-1.5 rounded-[9px] border border-[#e0e2e9] bg-white px-2.5 py-2 text-[.65rem] font-bold text-[#4a43e8]" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="rounded-[14px] bg-[#1d2028] p-2.5">
        <div
          ref={imageStageRef}
          className="relative mx-auto overflow-hidden rounded-[10px] bg-[#2a2e37] touch-none select-none"
          style={{ width: '100%', maxWidth: `${editorWidth}px`, aspectRatio: `${aspect}`, maxHeight: '430px' }}
          onPointerMove={handleCropMove}
          onPointerUp={stopCropInteraction}
          onPointerCancel={stopCropInteraction}
        >
          <img
            src={file.preview}
            alt="Photo being cropped"
            draggable={false}
            className="absolute left-1/2 top-1/2 h-full w-full max-w-none object-contain select-none"
            style={{ transform: imageTransform, filter: file.options.color === 'bw' ? 'grayscale(1)' : 'none' }}
          />

          <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
          <div
            className="z-10"
            style={cropStyle}
            onPointerDown={(event) => beginCropInteraction(event, 'move')}
            onPointerMove={handleCropMove}
            onPointerUp={stopCropInteraction}
            onPointerCancel={stopCropInteraction}
          >
            <div className="absolute inset-0 border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,.28)]" />
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: 'linear-gradient(to right, transparent 32.8%, rgba(255,255,255,.9) 33%, transparent 33.2%, transparent 66.8%, rgba(255,255,255,.9) 67%, transparent 67.2%), linear-gradient(to bottom, transparent 32.8%, rgba(255,255,255,.9) 33%, transparent 33.2%, transparent 66.8%, rgba(255,255,255,.9) 67%, transparent 67.2%)' }} />
            {renderCropHandle('tl', 'left top')}
            {renderCropHandle('tr', 'right top')}
            {renderCropHandle('bl', 'left bottom')}
            {renderCropHandle('br', 'right bottom')}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[.62rem] text-[#697181]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f2f7] px-2.5 py-1.5"><Crop size={13} /> Drag box = move crop</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f2f7] px-2.5 py-1.5">Corners = resize crop</span>
      </div>

      <div className="mt-3 grid grid-cols-[34px_minmax(100px,1fr)_34px_auto_auto] items-center gap-2 rounded-[12px] border border-[#e1e3ea] bg-white p-2.5 max-[520px]:grid-cols-[32px_minmax(80px,1fr)_32px_auto]">
        <button type="button" className="inline-flex min-h-[34px] items-center justify-center rounded-[9px] border border-[#e0e2e9] bg-white text-[#4a43e8]" onClick={() => updateZoom(editor.zoom - 0.1, true)} aria-label="Zoom out"><ZoomOut size={16} /></button>
        <input className="h-7 w-full cursor-ew-resize accent-[#4b46e8]" type="range" min="1" max="3" step="0.01" value={editor.zoom} onChange={(event) => updateZoom(event.target.value)} onPointerUp={(event) => updateZoom(event.currentTarget.value, true)} aria-label="Zoom" />
        <button type="button" className="inline-flex min-h-[34px] items-center justify-center rounded-[9px] border border-[#e0e2e9] bg-white text-[#4a43e8]" onClick={() => updateZoom(editor.zoom + 0.1, true)} aria-label="Zoom in"><ZoomIn size={16} /></button>
        <output className="min-w-[42px] text-right text-[.68rem] font-bold text-[#4a43e8]">{editor.zoom.toFixed(2)}×</output>
        <button type="button" className="inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-[9px] border border-[#e0e2e9] bg-white px-2.5 text-[.62rem] font-bold text-[#4a43e8] max-[520px]:col-span-4" onClick={rotate}><RotateCw size={15} /> Rotate</button>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[.6rem] text-[#8a90a0]">
        <span>{file.options.paperSize} · {file.options.orientation}</span>
        <span>Crop {Math.round((editor.cropRect.right - editor.cropRect.left) * 100)}% × {Math.round((editor.cropRect.bottom - editor.cropRect.top) * 100)}%</span>
        <span>{source.width} × {source.height}px</span>
      </div>

      <div className="mt-4 rounded-[14px] border border-[#e1e3eb] bg-[#f5f6f9] p-3">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <strong className="block text-[.74rem] text-[#202532]">Actual sheet layout</strong>
            <span className="mt-0.5 block text-[.62rem] leading-[1.4] text-[#7b8291]">{sheet.mode === 'single' ? `1 photo fills the ${file.options.paperSize || 'A4'} sheet.` : `${sheet.capacity} photos fit on one ${file.options.paperSize || 'A4'} sheet at ${file.options.imageWidthMm || 45} × ${file.options.imageHeightMm || 45} mm.`}</span>
          </div>
          <span className="whitespace-nowrap text-[.62rem] font-bold text-[#4a43e8]">{sheetsRequired} sheet{sheetsRequired === 1 ? '' : 's'}</span>
        </div>
        <div className="mx-auto overflow-hidden border border-[#d7d9e1] bg-white" style={{ aspectRatio: `${paper.width} / ${paper.height}`, width: '100%', maxWidth: '430px' }}>
          <div className="relative h-full w-full">
            <div
              className="absolute grid"
              style={{
                left: sheet.mode === 'single' ? '0%' : `${Math.max(0, (100 - (sheet.columns * sheet.imageWidth / paper.width * 100)) / 2)}%`,
                top: sheet.mode === 'single' ? '0%' : `${Math.max(0, (100 - (sheet.rows * sheet.imageHeight / paper.height * 100)) / 2)}%`,
                width: sheet.mode === 'single' ? '100%' : `${Math.min(100, sheet.columns * sheet.imageWidth / paper.width * 100)}%`,
                height: sheet.mode === 'single' ? '100%' : `${Math.min(100, sheet.rows * sheet.imageHeight / paper.height * 100)}%`,
                gridTemplateColumns: `repeat(${Math.max(1, sheet.columns)}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${Math.max(1, sheet.rows)}, minmax(0, 1fr))`,
                gap: sheet.mode === 'single' ? '0' : '1px',
              }}
            >
              {Array.from({ length: Math.max(1, sheet.capacity) }, (_, index) => (
                <div key={index} className="relative min-w-0 overflow-hidden bg-[#edf0f4]">
                  {file.preview && (
                    <img
                      src={file.preview}
                      alt=""
                      aria-hidden="true"
                      className="absolute max-w-none select-none"
                      style={{
                        width: `${100 / Math.max(.01, editor.cropRect.right - editor.cropRect.left)}%`,
                        height: `${100 / Math.max(.01, editor.cropRect.bottom - editor.cropRect.top)}%`,
                        left: `${-(editor.cropRect.left * 100) / Math.max(.01, editor.cropRect.right - editor.cropRect.left)}%`,
                        top: `${-(editor.cropRect.top * 100) / Math.max(.01, editor.cropRect.bottom - editor.cropRect.top)}%`,
                        objectFit: 'fill',
                        transform: `rotate(${rotation}deg)`,
                        filter: file.options.color === 'bw' ? 'grayscale(1)' : 'none',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
