// Shared helpers for quantity steppers across the app.
// All product/order quantities move and snap in increments of 0.5.

export const QTY_STEP = 0.5;

// Rounds any numeric input to the nearest multiple of `step` (default 0.5),
// clamped to a minimum (default 0). Non-numeric input becomes 0.
export function roundToStep(value, step = QTY_STEP, min = 0) {
  let n = Number(value);
  if (Number.isNaN(n)) n = 0;
  n = Math.round(n / step) * step;
  // Guard against floating point artifacts like 1.4999999999999998
  n = Math.round(n * 100) / 100;
  if (n < min) n = min;
  return n;
}
