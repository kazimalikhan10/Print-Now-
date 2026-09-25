import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { getPaperDimensions, getPhotoDimensions } from '../../utils/printPreview';
import PrintPagePreview from './PrintPagePreview';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function PhotoPrintPreview({ file, onChange }) {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [source, setSource] = useState({ width: 1, height: 1 });
  const [framePx, setFramePx] = useState({ width: 1, height: 1 });
  const [editor, setEditor] = useState({
    x: Number(file.options.crop?.x) || 0,
    y: Number(file.options.crop?.y) || 0,
    zoom: Number(file.options.crop?.zoom) || 1,
    rotation: ((Number(file.options.rotation) || 0) % 360 + 360) % 360,
  });
  const paper = getPaperDimensions(file.options.paperSize || 'A4', file.options.orientation || 'portrait');
  const rotation = editor.rotation;
  const fit = file.options.fit || 'fill';
  const crop = file.options.crop || { x: 0, y: 0, zoom: 1 };
  const photo = getPhotoDimensions(file, source.width / Math.max(1, source.height));
  const frameWidth = clamp(photo.width, 10, paper.width);
  const frameHeight = clamp(photo.height, 10, paper.height);
  const frameLeft = (paper.width - frameWidth) / 2;
  const frameTop = (paper.height - frameHeight) / 2;

  useEffect(() => {
    if (!file.preview) return undefined;
    const image = new Image();
    image.onload = () => setSource({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
    image.src = file.preview;
    return undefined;
  }, [file.preview]);

  useEffect(() => {
    setEditor({
      x: Number(crop.x) || 0,
      y: Number(crop.y) || 0,
      zoom: clamp(Number(crop.zoom) || 1, 1, 3),
      rotation: ((Number(file.options.rotation) || 0) % 360 + 360) % 360,
    });
  }, [file.id, file.options.rotation, crop.x, crop.y, crop.zoom]);

  useEffect(() => {
    const measure = () => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (rect) setFramePx({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (frameRef.current && observer) observer.observe(frameRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [frameWidth, frameHeight, paper.width, paper.height]);

  const geometry = useMemo(() => {
    const rotatedWidth = rotation % 180 === 0 ? source.width : source.height;
    const rotatedHeight = rotation % 180 === 0 ? source.height : source.width;
    const contain = Math.min(framePx.width / rotatedWidth, framePx.height / rotatedHeight);
    const cover = Math.max(framePx.width / rotatedWidth, framePx.height / rotatedHeight);
    const base = fit === 'fit' ? contain : cover;
    const scale = base * editor.zoom;
    const renderedWidth = rotatedWidth * scale;
    const renderedHeight = rotatedHeight * scale;
    const overflowX = Math.max(0, (renderedWidth - framePx.width) / 2);
    const overflowY = Math.max(0, (renderedHeight - framePx.height) / 2);
    return { scale, renderedWidth, renderedHeight, overflowX, overflowY };
  }, [editor.zoom, fit, framePx.height, framePx.width, rotation, source.height, source.width]);

  const x = clamp(editor.x, -geometry.overflowX, geometry.overflowX);
  const y = clamp(editor.y, -geometry.overflowY, geometry.overflowY);

  const persistEditor = (next) => {
    onChange({
      crop: {
        x: next.x,
        y: next.y,
        zoom: next.zoom,
      },
      rotation: next.rotation,
    });
  };

  const updateZoom = (value, persist = false) => {
    const nextZoom = clamp(Number(value), 1, 3);
    const ratio = nextZoom / Math.max(0.0001, editor.zoom);
    const nextOverflowX = Math.max(0, (geometry.renderedWidth * ratio - framePx.width) / 2);
    const nextOverflowY = Math.max(0, (geometry.renderedHeight * ratio - framePx.height) / 2);
    const next = {
      ...editor,
      zoom: nextZoom,
      x: clamp(editor.x, -nextOverflowX, nextOverflowX),
      y: clamp(editor.y, -nextOverflowY, nextOverflowY),
    };
    setEditor(next);
    if (persist) persistEditor(next);
  };

  const reset = () => {
    const next = { x: 0, y: 0, zoom: 1, rotation: 0 };
    setEditor(next);
    persistEditor(next);
  };

  const rotate = () => {
    const next = { ...editor, rotation: (editor.rotation + 90) % 360, x: 0, y: 0 };
    setEditor(next);
    persistEditor(next);
  };

  const handlePointerDown = (event) => {
    if (fit === 'fit' && geometry.overflowX === 0 && geometry.overflowY === 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { clientX: event.clientX, clientY: event.clientY, x, y };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.clientX;
    const dy = event.clientY - dragRef.current.clientY;
    const nextX = clamp(dragRef.current.x + dx, -geometry.overflowX, geometry.overflowX);
    const nextY = clamp(dragRef.current.y + dy, -geometry.overflowY, geometry.overflowY);
    setEditor((current) => ({ ...current, x: nextX, y: nextY }));
  };

  const stopDrag = () => {
    if (dragRef.current) persistEditor(editor);
    dragRef.current = null;
  };

  return (
    <section className="photo-editor">
      <div className="editor-heading">
        <div>
          <span className="eyebrow">PRINT EDITOR</span>
          <h2>Frame your photo</h2>
          <p>Move the original image inside the paper. Nothing is stretched.</p>
        </div>
        <button type="button" className="editor-reset" onClick={reset}><RotateCcw size={15} /> Reset</button>
      </div>

      <div className="paper-stage">
        <PrintPagePreview file={file}>
          <div
            ref={frameRef}
            className="photo-print-frame"
            style={{ left: `${(frameLeft / paper.width) * 100}%`, top: `${(frameTop / paper.height) * 100}%`, width: `${(frameWidth / paper.width) * 100}%`, height: `${(frameHeight / paper.height) * 100}%` }}
          >
            <div
              className="photo-crop-window"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onPointerLeave={stopDrag}
            >
              <img
                src={file.preview}
                alt="Original uploaded photo"
                draggable={false}
                className="photo-source"
                style={{
                  width: `${source.width * geometry.scale}px`,
                  height: `${source.height * geometry.scale}px`,
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  filter: file.options.color === 'bw' ? 'grayscale(1)' : 'none',
                }}
              />
              <div className="crop-grid" aria-hidden="true" />
              <span className="crop-corners" aria-hidden="true" />
            </div>
          </div>
        </PrintPagePreview>
      </div>

      <div className="editor-tools">
        <button type="button" className="tool-button" onClick={() => updateZoom(editor.zoom - 0.1, true)} aria-label="Zoom out"><ZoomOut size={17} /></button>
        <input
          className="editor-zoom"
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={editor.zoom}
          onChange={(event) => updateZoom(event.target.value)}
          onPointerUp={(event) => updateZoom(event.currentTarget.value, true)}
          aria-label="Zoom"
        />
        <button type="button" className="tool-button" onClick={() => updateZoom(editor.zoom + 0.1, true)} aria-label="Zoom in"><ZoomIn size={17} /></button>
        <output>{editor.zoom.toFixed(2)}×</output>
        <button type="button" className="tool-button rotate-tool" onClick={rotate}><RotateCw size={16} /> Rotate</button>
      </div>

      <div className="editor-meta">
        <span>{file.options.paperSize} · {file.options.orientation}</span>
        <span>{source.width} × {source.height}px</span>
        <span>{frameWidth.toFixed(0)} × {frameHeight.toFixed(0)} mm print area</span>
      </div>
    </section>
  );
}
