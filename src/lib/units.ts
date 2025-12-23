/**
 * Unit conversion utilities
 * Store internally in metric (mm), support both mm and inches in UI
 */

const MM_PER_INCH = 25.4;

/**
 * Convert millimeters to inches
 */
export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

/**
 * Convert inches to millimeters
 */
export function inchesToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

/**
 * Format dish size for display
 */
export function formatDishSize(mm: number, unit: 'mm' | 'inches' = 'mm'): string {
  if (unit === 'inches') {
    const inches = mmToInches(mm);
    return `${inches.toFixed(1)}"`;
  }
  return `${mm.toFixed(0)} mm`;
}

/**
 * Parse dish size from form input
 */
export function parseDishSize(value: string | number, unit: 'mm' | 'inches' = 'mm'): number {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue) || numValue <= 0) {
    throw new Error('Invalid dish size');
  }
  
  if (unit === 'inches') {
    return inchesToMm(numValue);
  }
  
  return numValue;
}

