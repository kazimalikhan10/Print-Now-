import { defaultPricing } from '../data/mockData';
import { getSelectedPageCount } from '../utils';

export function getPricing(shopOrPricing) {
  return shopOrPricing?.pricing || shopOrPricing || defaultPricing;
}

export function getLinePrice(file, pricing = defaultPricing) {
  const rates = getPricing(pricing);
  const copies = Math.max(1, Number(file.options?.copies) || 1);
  if (file.type === 'photo') {
    const photoTotal = (rates.photos[file.options?.paperSize] || rates.photos.A4) * copies;
    const finishing = file.options?.finishing || {};
    const finishingTotal = (finishing.lamination ? rates.finishing?.lamination || 0 : 0) + (finishing.binding ? rates.finishing?.binding || 0 : 0) + (finishing.stapling ? rates.finishing?.stapling || 0 : 0);
    return Math.round(photoTotal + finishingTotal);
  }
  const paper = rates.paper[file.options?.paperSize] || rates.paper.A4;
  const key = `${file.options?.color === 'color' ? 'color' : 'bw'}${file.options?.sides === 'double' ? 'Double' : 'Single'}`;
  const printTotal = getSelectedPageCount(file) * copies * (paper[key] || paper.bwSingle);
  const finishing = file.options?.finishing || {};
  const finishingTotal = (finishing.lamination ? rates.finishing?.lamination || 0 : 0) + (finishing.binding ? rates.finishing?.binding || 0 : 0) + (finishing.stapling ? rates.finishing?.stapling || 0 : 0);
  return Math.round(printTotal + finishingTotal);
}

export function getPricingBreakdown(file, pricing = defaultPricing) {
  const rates = getPricing(pricing);
  const copies = Math.max(1, Number(file.options?.copies) || 1);
  const pages = getSelectedPageCount(file);
  const unit = file.type === 'photo'
    ? (rates.photos[file.options?.paperSize] || rates.photos.A4)
    : (() => {
        const paper = rates.paper[file.options?.paperSize] || rates.paper.A4;
        return paper[`${file.options?.color === 'color' ? 'color' : 'bw'}${file.options?.sides === 'double' ? 'Double' : 'Single'}`] || paper.bwSingle;
      })();
  const finishing = file.options?.finishing || {};
  const finishingTotal = (finishing.lamination ? rates.finishing?.lamination || 0 : 0) + (finishing.binding ? rates.finishing?.binding || 0 : 0) + (finishing.stapling ? rates.finishing?.stapling || 0 : 0);
  return { pages, copies, unit, finishingTotal, total: getLinePrice(file, rates) };
}
