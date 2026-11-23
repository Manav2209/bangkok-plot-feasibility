export const number = (value: number | undefined, decimals = 0) =>
  value === undefined
    ? '—'
    : new Intl.NumberFormat('en', { maximumFractionDigits: decimals }).format(value);
