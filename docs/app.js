import { copyText, createHistory } from './history.js';
import { calculate, limits, pressureUnits, temperatureUnits } from './saturation.js';

const byId = id => document.getElementById(id);
const direction = byId('direction');
const source = byId('source');
const value = byId('value');
const unit = byId('unit');
const resultArea = byId('result');
const error = byId('lookup-error');
const copy = byId('copy-result');
const format = new Intl.NumberFormat('en', { maximumSignificantDigits: 8, useGrouping: false });
const rangeFormat = new Intl.NumberFormat('en', { maximumSignificantDigits: 15, useGrouping: false });
const display = number => Math.abs(number) > 0 && Math.abs(number) < 0.0001 ? number.toExponential(5) : format.format(number);
let clipboardResult = '';

const usesTemperature = () => direction.value === 'pressure';
const inputUnits = () => usesTemperature() ? temperatureUnits : pressureUnits;

function updateInput(selectedUnit) {
  const units = inputUnits();
  unit.replaceChildren(...Object.entries(units).map(([key, item]) => new Option(item.label, key)));
  if (units[selectedUnit]) unit.value = selectedUnit;
  byId('value-label').textContent = usesTemperature() ? 'Temperature' : 'Absolute pressure';
}

function updateOptions() {
  const selectedUnit = inputUnits()[unit.value];
  const [min, max] = limits(source.value, direction.value).map(selectedUnit.fromBase);
  const formatBound = source.value === 'textbook' && !usesTemperature() ? n => rangeFormat.format(n) : display;
  const range = formatBound(min) + ' to ' + formatBound(max) + ' ' + selectedUnit.label;
  byId('range').textContent = (source.value === 'table' ? 'Tabulated range: ' : 'Input range: ') + range;
}

function clearResult() {
  clipboardResult = '';
  copy.hidden = true;
  copy.textContent = 'Copy result';
  error.textContent = '';
  const hint = document.createElement('p');
  hint.className = 'panel-body muted';
  hint.textContent = 'Enter a value and click Calculate.';
  resultArea.replaceChildren(hint);
}

function render(result, settings) {
  const reverse = settings.direction === 'temperature';
  const panel = document.createElement('div');
  panel.className = 'metric';
  const pressure = display(result.pressure) + ' kPa';
  const temperature = display(result.temperature) + ' °C';
  clipboardResult = reverse ? temperature : pressure;

  const title = document.createElement('p');
  title.className = 'result-title';
  title.textContent = reverse ? 'Saturation temperature' : 'Saturation pressure';
  const reading = document.createElement('p');
  reading.className = 'metric-value';
  reading.textContent = clipboardResult;
  const input = document.createElement('p');
  input.className = 'result-meta';
  input.textContent = reverse ? pressure + ' absolute' : temperature;
  panel.append(title, reading, input);
  if (result.extrapolated || settings.source === 'equation') {
    const context = document.createElement('p');
    context.className = 'result-meta';
    context.textContent = result.extrapolated ? 'Extrapolated from MATLAB data' : 'Saved ASHRAE equation result';
    panel.append(context);
  }
  resultArea.replaceChildren(panel);
  copy.hidden = false;
}

function restoreCalculation({ settings, result }) {
  if (settings.source === 'moist-air') {
    throw new Error('This saved calculation used the earlier moist-air dataset. Use Copy to retrieve its values.');
  }
  direction.value = settings.direction;
  source.value = settings.source === 'equation' ? 'textbook' : settings.source;
  updateInput(settings.unit);
  value.value = settings.value;
  updateOptions();
  clearResult();
  render(result, settings);
}

const history = createHistory('water-saturation-history', { restore: restoreCalculation });

byId('lookup').addEventListener('submit', event => {
  event.preventDefault();
  clearResult();
  try {
    const settings = {
      direction: direction.value, source: source.value, unit: unit.value, value: value.value,
    };
    const selectedUnit = inputUnits()[settings.unit];
    const base = selectedUnit.toBase(value.valueAsNumber);
    const result = calculate(base, settings.direction, settings.source);
    render(result, settings);
    const summary = settings.value + ' ' + selectedUnit.label + ' → ' + clipboardResult;
    history.add(summary, { settings, result }, clipboardResult);
  } catch (failure) {
    error.textContent = failure.message;
  }
});

byId('give-example').addEventListener('click', () => {
  clearResult();
  const exampleTemperature = 25;
  const base = usesTemperature() ? exampleTemperature : calculate(exampleTemperature, 'pressure', source.value).pressure;
  value.value = inputUnits()[unit.value].fromBase(base);
  updateOptions();
});

direction.addEventListener('change', () => {
  updateInput();
  value.value = '';
  updateOptions();
  clearResult();
});

for (const element of [source, unit]) element.addEventListener('change', () => {
  updateOptions();
  clearResult();
});
value.addEventListener('input', clearResult);

copy.addEventListener('click', async () => {
  const text = clipboardResult;
  const copied = await copyText(text);
  if (text === clipboardResult) copy.textContent = copied ? 'Copied' : 'Copy failed';
});

updateInput();
updateOptions();
byId('calculate').disabled = false;
