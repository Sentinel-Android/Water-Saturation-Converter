import { matlabPressures, matlabTemperatures } from './matlab-saturation-data.js';

export const temperatureUnits = {
  C: { label: '°C', toBase: value => value, fromBase: value => value },
  F: { label: '°F', toBase: value => (value - 32) / 1.8, fromBase: value => value * 1.8 + 32 },
  K: { label: 'K', toBase: value => value - 273.15, fromBase: value => value + 273.15 },
};
export const pressureUnits = Object.fromEntries([
  ['kPa', 'kPa', 1], ['Pa', 'Pa', 0.001], ['bar', 'bar', 100], ['MPa', 'MPa', 1000], ['psi', 'psia', 6.894757293168],
].map(([key, label, scale]) => [key, { label, toBase: value => value * scale, fromBase: value => value / scale }]));

// These correlations are from the original MATLAB/psychrometry.m.
function textbookPressure(temperature) {
  const kelvin = temperature + 273.15;
  const scaledTemperature = kelvin / 1000;
  const K = 4.39553 - 6.2442 * scaledTemperature + 9.953 * scaledTemperature ** 2 - 5.151 * scaledTemperature ** 3;
  return 22100 * 10 ** (K * (1 - 647.30 / kelvin));
}

function textbookTemperature(pressure) {
  const alpha = Math.log(pressure);
  return 6.54 + 14.526 * alpha + 0.7389 * alpha ** 2 + 0.0949 * alpha ** 3 + 0.4569 * pressure ** 0.1984;
}

const textbookCurve = {
  min: 0,
  max: 200,
  // Input pressures at which the direct temperature correlation gives 0 and 93 °C.
  pressureRange: [0.6124912684077058, 78.6398246543034],
  pressure: textbookPressure,
  temperature: pressure => Math.max(0, Math.min(93, textbookTemperature(pressure))),
};

function compare(a, b) {
  const tolerance = 32 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) <= tolerance ? 0 : Math.sign(a - b);
}

function slopes(rows) {
  const widths = [];
  const secants = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const width = rows[i + 1][0] - rows[i][0];
    widths.push(width);
    secants.push((rows[i + 1][1] - rows[i][1]) / width);
  }
  if (secants.length === 1) return [secants[0], secants[0]];
  const endpoint = (h, nextH, d, nextD) => Math.max(0, ((2 * h + nextH) * d - h * nextD) / (h + nextH));
  const last = widths.length - 1;
  return rows.map((_, i) => {
    if (i === 0) return endpoint(widths[0], widths[1], secants[0], secants[1]);
    if (i === rows.length - 1) return endpoint(widths[last], widths[last - 1], secants[last], secants[last - 1]);
    const left = widths[i - 1];
    const right = widths[i];
    const a = 2 * right + left;
    const b = right + 2 * left;
    return (a + b) / (a / secants[i - 1] + b / secants[i]);
  });
}

function interpolator(rows) {
  const derivatives = slopes(rows);
  return value => {
    let lo = 0;
    let hi = rows.length - 1;
    while (hi - lo > 1) {
      const mid = Math.floor((hi + lo) / 2);
      if (rows[mid][0] <= value) lo = mid;
      else hi = mid;
    }
    const [x0, y0] = rows[lo];
    const [x1, y1] = rows[hi];
    if (value === x0) return y0;
    if (value === x1) return y1;
    const width = x1 - x0;
    const secant = (y1 - y0) / width;
    const leftSlope = derivatives[lo];
    const rightSlope = derivatives[hi];
    const quadratic = (3 * secant - 2 * leftSlope - rightSlope) / width;
    const cubic = (leftSlope + rightSlope - 2 * secant) / width ** 2;
    const offset = value - x0;
    return ((cubic * offset + quadratic) * offset + leftSlope) * offset + y0;
  };
}

// MATLAB calls interp1 with 'pchip', 'extrap' in both directions.
const matlabRows = matlabTemperatures.map((temperature, index) => [temperature, matlabPressures[index]]);
const matlabCurve = {
  min: matlabTemperatures[0],
  max: matlabTemperatures.at(-1),
  pressureRange: [matlabPressures[0], matlabPressures.at(-1)],
  pressure: interpolator(matlabRows),
  temperature: interpolator(matlabRows.map(([temperature, pressure]) => [pressure, temperature])),
};

export function limits(source, direction) {
  const curve = source === 'table' ? matlabCurve : textbookCurve;
  return direction === 'pressure' ? [curve.min, curve.max] : curve.pressureRange;
}

export function calculate(value, direction, source) {
  if (!Number.isFinite(value)) throw new Error('Enter a finite input value.');
  const [min, max] = limits(source, direction);
  if (source === 'table') {
    const column = direction === 'pressure' ? 0 : 1;
    const row = matlabRows.find(entry => entry[column] === value);
    const temperature = row?.[0] ?? (direction === 'pressure' ? value : matlabCurve.temperature(value));
    const pressure = row?.[1] ?? (direction === 'pressure' ? matlabCurve.pressure(value) : value);
    const extrapolated = value < min || value > max;
    return { temperature, pressure, extrapolated };
  }

  if (compare(value, min) < 0 || compare(value, max) > 0) {
    throw new Error('This value is outside the available range.');
  }
  const input = Math.max(min, Math.min(max, value));
  const temperature = direction === 'pressure' ? input : textbookCurve.temperature(input);
  const pressure = direction === 'pressure' ? textbookCurve.pressure(input) : input;
  return { temperature, pressure };
}
