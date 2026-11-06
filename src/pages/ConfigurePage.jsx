import { useState } from 'react';
import { Minus, Plus, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import OptionGroup from '../components/printing/OptionGroup';
import ChoiceGrid from '../components/printing/ChoiceGrid';
import DocumentPreview from '../components/printing/DocumentPreview';
import PhotoPrintPreview from '../components/printing/PhotoPrintPreview';
import PrintQualityWarnings from '../components/printing/PrintQualityWarnings';
import { useOrder } from '../context/OrderContext';
import { getSelectedPageCount } from '../utils';
import { createCroppedPhotoFile } from '../utils/cropImage';
import { createPhotoSheetPdf } from '../utils/photoSheetPdf';
import { deleteBackendFile, uploadFileToBackend } from '../services/apiService';

export default function ConfigurePage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { order, updateFileOptions, updateFile } = useOrder();
  const [savingCrop, setSavingCrop] = useState(false);
  const [cropError, setCropError] = useState('');
  const file = order.files.find((item) => item.id === fileId);
  const isPhoto = file?.type === 'photo';

  if (!file) {
    navigate('/files', { replace: true });
    return null;
  }

  const update = (key, value) => updateFileOptions(file.id, { [key]: value });

  const selectedPageCount = !isPhoto ? getSelectedPageCount(file) : 1;
  const invalidCustomRange = !isPhoto && file.options.pageSelection === 'custom' && selectedPageCount < 1;

  const handleDone = async () => {
    if (!isPhoto) {
      navigate(location.state?.returnTo || '/files');
      return;
    }
    setSavingCrop(true);
    setCropError('');
    try {
      const croppedFile = await createCroppedPhotoFile(file.sourceFile, file.options);
      const sheetPdf = await createPhotoSheetPdf(croppedFile, file.options);
      const uploaded = await uploadFileToBackend(sheetPdf);
      const oldBackendFileId = file.backendFileId || file.previousBackendFileId || null;
      updateFile(file.id, {
        croppedFile,
        croppedPreview: URL.createObjectURL(croppedFile),
        photoSheetPdf: true,
        sheetPdfName: sheetPdf.name,
        backendFileId: uploaded.id,
        backendFileStatus: uploaded.status,
        backendValidation: uploaded.validation,
        backendAnalysis: uploaded.analysis,
        previousBackendFileId: null,
        size: sheetPdf.size,
        configured: true,
      });
      if (oldBackendFileId && oldBackendFileId !== uploaded.id) {
        try { await deleteBackendFile(oldBackendFileId); } catch (cleanupError) { console.warn('Could not remove the previous cropped photo upload:', cleanupError); }
      }
      navigate(location.state?.returnTo || '/files');
    } catch (error) {
      updateFile(file.id, { configured: false });
      setCropError(error?.message || 'Could not crop and upload this photo. Please try again.');
    } finally {
      setSavingCrop(false);
    }
  };
  const paperOptions = order.shop.paperSizes.filter((value) => ['A4', 'A3'].includes(value)).map((value) => ({ value, label: value }));
  const colorOptions = [
    order.shop.settings?.acceptsBw !== false ? { value: 'bw', label: 'Black & White', icon: <span className="bw-dot" /> } : null,
    order.shop.settings?.acceptsColor !== false ? { value: 'color', label: 'Colour', icon: <span className="color-dot" /> } : null,
  ].filter(Boolean);
  const sideOptions = [
    order.shop.settings?.acceptsSingle !== false ? { value: 'single', label: 'Single-sided' } : null,
    order.shop.settings?.acceptsDouble !== false ? { value: 'double', label: 'Double-sided' } : null,
  ].filter(Boolean);


  return (
    <>
      <Header showBack onBack={() => navigate(location.state?.returnTo || '/files')} />
      <PageShell>

        <div className="configure-layout">
          <div className="configure-preview-column">
            <div className="page-intro compact">
              <span className="step-label">CONFIGURE FILE</span>
              <h1>{file.name}</h1>
              <p>{isPhoto ? 'Crop your photo, choose its physical size and arrange 6 or 12 copies on an A4 print sheet.' : `${file.pages} total pages · ${getSelectedPageCount(file)} selected · Configure the physical print output.`}</p>
            </div>

            {isPhoto && file.preview ? (
              <PhotoPrintPreview file={file} onChange={(options) => updateFileOptions(file.id, options)} />
            ) : (
              <div className="document-preview-card preview-surface">
                <DocumentPreview file={file} onPageCount={(count) => { if (count !== Number(file.pages)) updateFile(file.id, { pages: count }); }} />
              </div>
            )}
            <PrintQualityWarnings file={file} />
          </div>

          <div className="configure-options-column">
            <div className="options-card">
              <div className="options-card-heading"><span className="eyebrow">PRINT SETTINGS</span><strong>Output</strong></div>

              {isPhoto ? (
                <>
                  <OptionGroup label="Photos on A4 sheet">
                    <ChoiceGrid value={String(file.options.photoQuantity || 6)} onChange={(value) => update('photoQuantity', Number(value))} options={[
                      { value: '6', label: '6 photos' },
                      { value: '12', label: '12 photos' },
                    ]} />
                  </OptionGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold">Photo width (mm)<input type="number" min="10" max="100" step="0.5" className="min-h-10 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal" value={file.options.imageWidthMm ?? 35} onChange={(event) => update('imageWidthMm', event.target.value)} /></label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold">Photo height (mm)<input type="number" min="10" max="120" step="0.5" className="min-h-10 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal" value={file.options.imageHeightMm ?? 45} onChange={(event) => update('imageHeightMm', event.target.value)} /></label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold">Sheet margin (mm)<input type="number" min="0" max="20" step="0.5" className="min-h-10 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal" value={file.options.sheetMarginMm ?? 5} onChange={(event) => update('sheetMarginMm', event.target.value)} /></label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold">Photo spacing (mm)<input type="number" min="0" max="15" step="0.5" className="min-h-10 rounded-xl border border-[#dfe3eb] px-3 text-sm font-normal" value={file.options.sheetGapMm ?? 3} onChange={(event) => update('sheetGapMm', event.target.value)} /></label>
                  </div>
                  <p className="option-help">The cropped photo is placed at the exact physical size you enter, repeated 6 or 12 times, and exported as a one-page A4 PDF. The backend receives this PDF as a document; no backend changes are needed.</p>
                </>
              ) : (
                <>
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
                    <div className="stepper"><button type="button" onClick={() => update('copies', Math.max(1, file.options.copies - 1))}><Minus size={18} /></button><strong>{file.options.copies}</strong><button type="button" onClick={() => update('copies', Math.min(100, file.options.copies + 1))}><Plus size={18} /></button></div>
                  </OptionGroup>
                  <OptionGroup label="Pages"><ChoiceGrid value={file.options.pageSelection} onChange={(value) => update('pageSelection', value)} options={[{ value: 'all', label: `All ${file.pages} Pages` }, { value: 'custom', label: 'Custom' }]} />{file.options.pageSelection === 'custom' && <input className="page-range-input" value={file.options.pageRange || ''} onChange={(event) => update('pageRange', event.target.value)} placeholder={`Example: 1-${file.pages}`} aria-label="Custom page range" />}</OptionGroup>
                  <OptionGroup label="Sides"><ChoiceGrid value={file.options.sides} onChange={(value) => update('sides', value)} options={sideOptions} /></OptionGroup>
                </>
              )}
            </div>
          </div>
        </div>

        {invalidCustomRange && <div className="form-error configure-warning" role="alert">Enter a page range or choose All Pages before continuing.</div>}
        {cropError && <div className="form-error configure-warning" role="alert">{cropError}</div>}
        <div className="configure-actions"><Button className="bottom-cta" disabled={invalidCustomRange || savingCrop} onClick={handleDone}>{savingCrop ? 'Creating A4 sheet & uploading…' : isPhoto ? 'Create A4 sheet & continue' : 'Done editing'}</Button></div>
      </PageShell>
    </>
  );
}
