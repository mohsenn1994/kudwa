/**
 * Currency / number formatting helpers used across the table and dashboard.
 */

export function formatMoney(value: number, currency = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  // Compact for thousands; 0 decimals for cleaner column alignment.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyCompact(value: number, currency = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
