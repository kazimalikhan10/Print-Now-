import { Check, Image as ImageIcon, Minus, Plus, RectangleHorizontal, RectangleVertical, Scissors, Layers3, Paperclip } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPaperDimensions } from '../utils/printPreview';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import OptionGroup from '../components/printing/OptionGroup';
import ChoiceGrid from '../components/printing/ChoiceGrid';
import StepIndicator from '../components/ui/StepIndicator';
import DocumentPreview from '../components/printing/DocumentPreview';
import PhotoPrintPreview from '../components/printing/PhotoPrintPreview';
import PrintQualityWarnings from '../components/printing/PrintQualityWarnings';
import { useOrder } from '../context/OrderContext';
import { getSelectedPageCount } from '../utils';

export default function ConfigurePage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { order, updateFileOptions } = useOrder();
  const file = order.files.find((item) => item.id === fileId);
  const isPhoto = file?.type === 'photo';

  if (!file) {
    navigate('/files', { replace: true });
    return null;
  }

  const update = (key, value) => {
    if (isPhoto && (key === 'paperSize' || key === 'orientation')) {
      const previousPaper = getPaperDimensions(file.options.paperSize || 'A4', file.options.orientation || 'portrait');
      const nextPaper = getPaperDimensions(
        key === 'paperSize' ? value : file.options.paperSize || 'A4',
        key === 'orientation' ? value : file.options.orientation || 'portrait'
      );
      const currentWidth = Number(file.options.imageWidthMm);
      const currentHeight = Number(file.options.imageHeightMm);
      const isPaperFrame = Math.abs(currentWidth - previousPaper.width) < 0.5 && Math.abs(currentHeight - previousPaper.height) < 0.5;
      updateFileOptions(file.id, isPaperFrame
        ? { [key]: value, imageWidthMm: nextPaper.width, imageHeightMm: nextPaper.height, crop: { x: 0, y: 0, zoom: 1 } }
        : { [key]: value, crop: { ...(file.options.crop || { x: 0, y: 0, zoom: 1 }), x: 0, y: 0 } });
      return;
    }
    updateFileOptions(file.id, { [key]: value });
  };

  const updateCrop = (changes) => updateFileOptions(file.id, changes);
  const invalidCustomRange = !isPhoto && file.options.pageSelection === 'custom' && !file.options.pageRange?.trim();
  const paperOptions = (isPhoto ? order.shop.photoSizes : order.shop.paperSizes).map((value) => ({ value, label: value }));
  const colorOptions = [
    order.shop.settings?.acceptsBw !== false ? { value: 'bw', label: 'Black & White', icon: <span className="bw-dot" /> } : null,
    order.shop.settings?.acceptsColor !== false ? { value: 'color', label: 'Colour', icon: <span className="color-dot" /> } : null,
  ].filter(Boolean);
  const sideOptions = [
    order.shop.settings?.acceptsSingle !== false ? { value: 'single', label: 'Single-sided' } : null,
    order.shop.settings?.acceptsDouble !== false ? { value: 'double', label: 'Double-sided' } : null,
  ].filter(Boolean);
  const finishingOptions = [
    order.shop.settings?.lamination !== false ? ['lamination','Lamination',Scissors] : null,
    order.shop.settings?.binding !== false ? ['binding','Binding',Layers3] : null,
    order.shop.settings?.stapling !== false ? ['stapling','Stapling',Paperclip] : null,
  ].filter(Boolean);

  return (
    <>
      <Header showBack onBack={() => navigate('/files')} />
      <PageShell>
        <StepIndicator current={3} />

        <div className="configure-layout">
          <div className="configure-preview-column">
            <div className="page-intro compact">
              <span className="step-label">CONFIGURE FILE</span>
              <h1>{file.name}</h1>
              <p>{isPhoto ? 'Set the physical paper and frame the original image exactly as it will print.' : `${file.pages} total pages · ${getSelectedPageCount(file)} selected · Configure the physical print output.`}</p>
            </div>

            {isPhoto && file.preview ? (
              <PhotoPrintPreview file={file} onChange={updateCrop} />
            ) : (
              <div className="document-preview-card preview-surface">
                <DocumentPreview file={file} />
              </div>
            )}
            <PrintQualityWarnings file={file} />
          </div>

          <div className="configure-options-column">
            <div className="options-card">
              <div className="options-card-heading"><span className="eyebrow">PRINT SETTINGS</span><strong>Output</strong></div>

              <OptionGroup label="Paper Size">
                <ChoiceGrid value={file.options.paperSize} onChange={(value) => update('paperSize', value)} options={paperOptions} />
              </OptionGroup>

              <OptionGroup label="Orientation">
                <ChoiceGrid value={file.options.orientation} onChange={(value) => update('orientation', value)} options={[
                  { value: 'portrait', label: 'Portrait', icon: <RectangleVertical size={18} /> },
                  { value: 'landscape', label: 'Landscape', icon: <RectangleHorizontal size={18} /> },
                ]} />
              </OptionGroup>

              <OptionGroup label="Colour">
                <ChoiceGrid value={file.options.color} onChange={(value) => update('color', value)} options={colorOptions} />
              </OptionGroup>

              <OptionGroup label="Copies">
                <div className="stepper"><button type="button" onClick={() => update('copies', Math.max(1, file.options.copies - 1))}><Minus size={18} /></button><strong>{file.options.copies}</strong><button type="button" onClick={() => update('copies', file.options.copies + 1)}><Plus size={18} /></button></div>
              </OptionGroup>

              <OptionGroup label="Finishing">
                <div className="finishing-grid">
                  {finishingOptions.map(([key,label,Icon]) => <button type="button" key={key} className={`finishing-option ${file.options.finishing?.[key] ? 'active' : ''}`} onClick={() => update('finishing', { ...(file.options.finishing || {}), [key]: !file.options.finishing?.[key] })}><Icon size={17}/><span>{label}</span><small>{key==='lamination' ? `₹${order.shop.pricing?.finishing?.lamination || 20}` : key==='binding' ? `₹${order.shop.pricing?.finishing?.binding || 40}` : `₹${order.shop.pricing?.finishing?.stapling || 5}`}</small></button>)}
                </div>
              </OptionGroup>

              {isPhoto ? (
                <>
                  <OptionGroup label="Framing">
                    <ChoiceGrid value={file.options.fit} onChange={(value) => update('fit', value)} options={[
                      { value: 'fit', label: 'Fit entire image', icon: <Check size={17} /> },
                      { value: 'fill', label: 'Fill & crop', icon: <ImageIcon size={17} /> },
                    ]} />
                  </OptionGroup>
                  <OptionGroup label="Exact Image Size">
                    <div className="size-input-grid"><label><span>Width (mm)</span><input type="number" min="10" max="500" value={file.options.imageWidthMm || ''} onChange={(e) => update('imageWidthMm', Number(e.target.value))} /></label><label><span>Height (mm)</span><input type="number" min="10" max="500" value={file.options.imageHeightMm || ''} onChange={(e) => update('imageHeightMm', Number(e.target.value))} /></label></div>
                    <p className="option-help">The white paper is the selected paper size. These fields control the physical image/frame size on that paper.</p>
                  </OptionGroup>
                </>
              ) : (
                <>
                  <OptionGroup label="Pages"><ChoiceGrid value={file.options.pageSelection} onChange={(value) => update('pageSelection', value)} options={[{ value: 'all', label: `All ${file.pages} Pages` }, { value: 'custom', label: 'Custom' }]} />{file.options.pageSelection === 'custom' && <input className="page-range-input" value={file.options.pageRange || ''} onChange={(event) => update('pageRange', event.target.value)} placeholder={`Example: 1-${file.pages}`} aria-label="Custom page range" />}</OptionGroup>
                  <OptionGroup label="Sides"><ChoiceGrid value={file.options.sides} onChange={(value) => update('sides', value)} options={sideOptions} /></OptionGroup>
                </>
              )}
            </div>
          </div>
        </div>

        {invalidCustomRange && <div className="form-error configure-warning" role="alert">Enter a page range or choose All Pages before continuing.</div>}
        <div className="configure-actions"><Button className="bottom-cta" disabled={invalidCustomRange} onClick={() => navigate('/files')}>Save & Continue</Button></div>
      </PageShell>
    </>
  );
}
