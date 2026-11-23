// Generated from src/. Run npm run build after changing calculator source.
(() => {
  // src/history.js
  var databaseName = "aditusan-calculation-history";
  var database;
  function openDatabase() {
    database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        const records = db.createObjectStore("records", { keyPath: "id", autoIncrement: true });
        records.createIndex("scope", "scope");
        db.createObjectStore("snapshots");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Calculation history storage is blocked."));
    });
    return database;
  }
  function resultOf(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function changeHistory(scope, update) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["records", "snapshots"], "readwrite");
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(transaction.error ?? new Error("History storage is unavailable."));
      const records = transaction.objectStore("records");
      const snapshots = transaction.objectStore("snapshots");
      const matches = records.index("scope").getAll(scope);
      matches.onsuccess = () => update(matches.result, records, snapshots);
    });
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const focused = document.activeElement;
      const field = document.createElement("textarea");
      field.value = text;
      field.readOnly = true;
      field.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
      document.body.append(field);
      field.select();
      try {
        return document.execCommand("copy");
      } catch {
        return false;
      } finally {
        field.remove();
        focused?.focus({ preventScroll: true });
      }
    }
  }
  function createHistory(id, { restore, limit = 20 }) {
    const panel = document.getElementById(id);
    const list = panel.querySelector(".history-list");
    const empty = panel.querySelector(".history-empty");
    const clear = panel.querySelector(".history-clear");
    const note = panel.querySelector(".history-message");
    const scope = location.pathname.replace(/(?:index|local-preview)\.html$/, "").replace(/\/?$/, "/") + "#" + id;
    let pending = Promise.resolve();
    let temporary = [];
    function render2(entries) {
      list.replaceChildren();
      empty.hidden = entries.length > 0;
      clear.disabled = entries.length === 0;
      for (const entry of entries) {
        const row = document.createElement("li");
        const description = document.createElement("span");
        description.textContent = entry.summary;
        const when = document.createElement("small");
        when.className = "history-time";
        when.textContent = new Date(entry.time).toLocaleString(void 0, { dateStyle: "short", timeStyle: "short" });
        description.append(when);
        const actions = document.createElement("div");
        actions.className = "history-actions";
        const restoreButton = document.createElement("button");
        restoreButton.type = "button";
        restoreButton.textContent = "Restore";
        restoreButton.setAttribute("aria-label", "Restore " + entry.summary);
        restoreButton.addEventListener("click", async () => {
          try {
            const snapshot = entry.snapshot ?? await resultOf((await openDatabase()).transaction("snapshots").objectStore("snapshots").get(entry.id));
            if (!snapshot) throw new Error("That calculation was cleared.");
            restore(snapshot);
            note.textContent = "Calculation restored.";
          } catch (error2) {
            note.textContent = error2.message;
          }
        });
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.textContent = "Copy";
        copyButton.setAttribute("aria-label", "Copy result for " + entry.summary);
        copyButton.addEventListener("click", async () => {
          note.textContent = await copyText(entry.clipboardText) ? "Copied to clipboard." : "Clipboard access was unavailable.";
        });
        actions.append(restoreButton, copyButton);
        row.append(description, actions);
        list.append(row);
      }
    }
    async function refresh() {
      let entries = [];
      try {
        const db = await openDatabase();
        entries = await resultOf(db.transaction("records").objectStore("records").index("scope").getAll(scope));
      } catch {
        if (!note.textContent) note.textContent = "History is available for this tab only.";
      }
      render2([...temporary, ...entries.reverse()].slice(0, limit));
    }
    clear.addEventListener("click", () => {
      pending = pending.then(async () => {
        temporary = [];
        try {
          await changeHistory(scope, (entries, records, snapshots) => {
            for (const entry of entries) {
              records.delete(entry.id);
              snapshots.delete(entry.id);
            }
          });
          note.textContent = "History cleared.";
        } catch {
          note.textContent = "Tab history cleared.";
        }
        await refresh();
      });
    });
    pending = refresh();
    return {
      add(summary, snapshot, clipboardText) {
        const record = { scope, summary, time: Date.now(), bytes: 0, clipboardText };
        pending = pending.then(async () => {
          try {
            await changeHistory(scope, (entries, records, snapshots) => {
              for (const entry of entries.slice(0, Math.max(0, entries.length - limit + 1))) {
                records.delete(entry.id);
                snapshots.delete(entry.id);
              }
              const insert = records.add(record);
              insert.onsuccess = () => snapshots.add(snapshot, insert.result);
            });
            note.textContent = "";
          } catch {
            temporary = [{ ...record, snapshot }, ...temporary].slice(0, limit);
            note.textContent = "History is available for this tab only.";
          }
          await refresh();
        });
      }
    };
  }

  // src/matlab-saturation-data.js
  var matlabTemperatures = [
    -60,
    -59,
    -58,
    -57,
    -56,
    -55,
    -54,
    -53,
    -52,
    -51,
    -50,
    -49,
    -48,
    -47,
    -46,
    -45,
    -44,
    -43,
    -42,
    -41,
    -40,
    -39,
    -38,
    -37,
    -36,
    -35,
    -34,
    -33,
    -32,
    -31,
    -30,
    -29,
    -28,
    -27,
    -26,
    -25,
    -24,
    -23,
    -22,
    -21,
    -20,
    -19,
    -18,
    -17,
    -16,
    -15,
    -14,
    -13,
    -12,
    -11,
    -10,
    -9,
    -8,
    -7,
    -6,
    -5,
    -4,
    -3,
    -2,
    -1,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
    90,
    91,
    92,
    93,
    94,
    95,
    96,
    97,
    98,
    99,
    100,
    101,
    102,
    103,
    104,
    105,
    106,
    107,
    108,
    109,
    110,
    111,
    112,
    113,
    114,
    115,
    116,
    117,
    118,
    119,
    120,
    122,
    124,
    126,
    128,
    130,
    132,
    134,
    136,
    138,
    140,
    142,
    144,
    146,
    148,
    150,
    152,
    154,
    156,
    158,
    160
  ];
  var matlabPressures = [
    108e-5,
    124e-5,
    141e-5,
    161e-5,
    184e-5,
    209e-5,
    238e-5,
    271e-5,
    307e-5,
    348e-5,
    394e-5,
    445e-5,
    503e-5,
    568e-5,
    64e-4,
    72e-4,
    81e-4,
    91e-4,
    0.01022,
    0.01146,
    0.01284,
    0.01437,
    0.01607,
    0.01795,
    0.02004,
    0.02234,
    0.02489,
    0.02771,
    0.03081,
    0.03423,
    0.03801,
    0.04215,
    0.04672,
    0.05173,
    0.05724,
    0.06237,
    0.06989,
    0.07714,
    0.08508,
    0.09376,
    0.10324,
    0.1136,
    0.1249,
    0.13722,
    0.15065,
    0.16527,
    0.18119,
    0.19849,
    0.21729,
    0.23771,
    0.25987,
    0.28391,
    0.30995,
    0.33817,
    0.36871,
    0.40174,
    0.43745,
    0.47604,
    0.5177,
    0.56266,
    0.61115,
    0.6571,
    0.706,
    0.7581,
    0.8135,
    0.8726,
    0.9354,
    1.0021,
    1.073,
    1.1483,
    1.2282,
    1.3129,
    1.4028,
    1.4981,
    1.5989,
    1.7057,
    1.8188,
    1.9383,
    2.0647,
    2.1982,
    2.3392,
    2.4881,
    2.6452,
    2.8109,
    2.9856,
    3.1697,
    3.3637,
    3.5679,
    3.7828,
    4.0089,
    4.2467,
    4.4966,
    4.7592,
    5.0351,
    5.3247,
    5.6286,
    5.9475,
    6.2818,
    6.6324,
    6.9997,
    7.3844,
    7.7873,
    8.209,
    8.6503,
    9.1118,
    9.5944,
    10.0988,
    10.6259,
    11.1764,
    11.7512,
    12.3513,
    12.9774,
    13.6305,
    14.3116,
    15.0215,
    15.7614,
    16.5322,
    17.335,
    18.1708,
    19.0407,
    19.9458,
    20.8873,
    21.8664,
    22.8842,
    23.9421,
    25.0411,
    26.1827,
    27.368,
    28.5986,
    29.8756,
    31.2006,
    32.575,
    34.0001,
    35.4775,
    37.0088,
    38.5954,
    40.2389,
    41.9409,
    43.7031,
    45.5271,
    47.4147,
    49.3676,
    51.3875,
    53.4762,
    55.6355,
    57.8675,
    60.1738,
    62.5565,
    65.0174,
    67.5587,
    70.1824,
    72.8904,
    75.6849,
    78.5681,
    81.542,
    84.6089,
    87.7711,
    91.0308,
    94.3902,
    97.8518,
    101.418,
    105.091,
    108.8735,
    112.7678,
    116.7765,
    120.9021,
    125.1472,
    129.5145,
    134.0065,
    138.6261,
    143.376,
    148.2588,
    153.2775,
    158.4348,
    163.7737,
    169.177,
    174.7678,
    180.509,
    186.4036,
    192.4547,
    198.6654,
    211.5782,
    225.1676,
    239.4597,
    254.4813,
    270.2596,
    286.8226,
    304.1989,
    322.4175,
    341.5081,
    361.501,
    382.4271,
    404.3178,
    427.2053,
    451.122,
    476.1014,
    502.1771,
    529.3834,
    557.7555,
    587.3287,
    618.1392
  ];

  // src/saturation.js
  var temperatureUnits = {
    C: { label: "\xB0C", toBase: (value2) => value2, fromBase: (value2) => value2 },
    F: { label: "\xB0F", toBase: (value2) => (value2 - 32) / 1.8, fromBase: (value2) => value2 * 1.8 + 32 },
    K: { label: "K", toBase: (value2) => value2 - 273.15, fromBase: (value2) => value2 + 273.15 }
  };
  var pressureUnits = Object.fromEntries([
    ["kPa", "kPa", 1],
    ["Pa", "Pa", 1e-3],
    ["bar", "bar", 100],
    ["MPa", "MPa", 1e3],
    ["psi", "psia", 6.894757293168]
  ].map(([key, label, scale]) => [key, { label, toBase: (value2) => value2 * scale, fromBase: (value2) => value2 / scale }]));
  function textbookPressure(temperature) {
    const kelvin = temperature + 273.15;
    const scaledTemperature = kelvin / 1e3;
    const K = 4.39553 - 6.2442 * scaledTemperature + 9.953 * scaledTemperature ** 2 - 5.151 * scaledTemperature ** 3;
    return 22100 * 10 ** (K * (1 - 647.3 / kelvin));
  }
  function textbookTemperature(pressure) {
    const alpha = Math.log(pressure);
    return 6.54 + 14.526 * alpha + 0.7389 * alpha ** 2 + 0.0949 * alpha ** 3 + 0.4569 * pressure ** 0.1984;
  }
  var textbookCurve = {
    min: 0,
    max: 200,
    // Input pressures at which the direct temperature correlation gives 0 and 93 °C.
    pressureRange: [0.6124912684077058, 78.6398246543034],
    pressure: textbookPressure,
    temperature: (pressure) => Math.max(0, Math.min(93, textbookTemperature(pressure)))
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
    return (value2) => {
      let lo = 0;
      let hi = rows.length - 1;
      while (hi - lo > 1) {
        const mid = Math.floor((hi + lo) / 2);
        if (rows[mid][0] <= value2) lo = mid;
        else hi = mid;
      }
      const [x0, y0] = rows[lo];
      const [x1, y1] = rows[hi];
      if (value2 === x0) return y0;
      if (value2 === x1) return y1;
      const width = x1 - x0;
      const secant = (y1 - y0) / width;
      const leftSlope = derivatives[lo];
      const rightSlope = derivatives[hi];
      const quadratic = (3 * secant - 2 * leftSlope - rightSlope) / width;
      const cubic = (leftSlope + rightSlope - 2 * secant) / width ** 2;
      const offset = value2 - x0;
      return ((cubic * offset + quadratic) * offset + leftSlope) * offset + y0;
    };
  }
  var matlabRows = matlabTemperatures.map((temperature, index) => [temperature, matlabPressures[index]]);
  var matlabCurve = {
    min: matlabTemperatures[0],
    max: matlabTemperatures.at(-1),
    pressureRange: [matlabPressures[0], matlabPressures.at(-1)],
    pressure: interpolator(matlabRows),
    temperature: interpolator(matlabRows.map(([temperature, pressure]) => [pressure, temperature]))
  };
  function limits(source2, direction2) {
    const curve = source2 === "table" ? matlabCurve : textbookCurve;
    return direction2 === "pressure" ? [curve.min, curve.max] : curve.pressureRange;
  }
  function calculate(value2, direction2, source2) {
    if (!Number.isFinite(value2)) throw new Error("Enter a finite input value.");
    const [min, max] = limits(source2, direction2);
    if (source2 === "table") {
      const column = direction2 === "pressure" ? 0 : 1;
      const row = matlabRows.find((entry) => entry[column] === value2);
      const temperature2 = row?.[0] ?? (direction2 === "pressure" ? value2 : matlabCurve.temperature(value2));
      const pressure2 = row?.[1] ?? (direction2 === "pressure" ? matlabCurve.pressure(value2) : value2);
      const extrapolated = value2 < min || value2 > max;
      return { temperature: temperature2, pressure: pressure2, extrapolated };
    }
    if (compare(value2, min) < 0 || compare(value2, max) > 0) {
      throw new Error("This value is outside the available range.");
    }
    const input = Math.max(min, Math.min(max, value2));
    const temperature = direction2 === "pressure" ? input : textbookCurve.temperature(input);
    const pressure = direction2 === "pressure" ? textbookCurve.pressure(input) : input;
    return { temperature, pressure };
  }

  // src/calculator.js
  var byId = (id) => document.getElementById(id);
  var direction = byId("direction");
  var source = byId("source");
  var value = byId("value");
  var unit = byId("unit");
  var resultArea = byId("result");
  var error = byId("lookup-error");
  var copy = byId("copy-result");
  var format = new Intl.NumberFormat("en", { maximumSignificantDigits: 8, useGrouping: false });
  var rangeFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 15, useGrouping: false });
  var display = (number) => Math.abs(number) > 0 && Math.abs(number) < 1e-4 ? number.toExponential(5) : format.format(number);
  var clipboardResult = "";
  var usesTemperature = () => direction.value === "pressure";
  var inputUnits = () => usesTemperature() ? temperatureUnits : pressureUnits;
  function updateInput(selectedUnit) {
    const units = inputUnits();
    unit.replaceChildren(...Object.entries(units).map(([key, item]) => new Option(item.label, key)));
    if (units[selectedUnit]) unit.value = selectedUnit;
    byId("value-label").textContent = usesTemperature() ? "Temperature" : "Absolute pressure";
  }
  function updateOptions() {
    const selectedUnit = inputUnits()[unit.value];
    const [min, max] = limits(source.value, direction.value).map(selectedUnit.fromBase);
    const formatBound = source.value === "textbook" && !usesTemperature() ? (n) => rangeFormat.format(n) : display;
    const range = formatBound(min) + " to " + formatBound(max) + " " + selectedUnit.label;
    byId("range").textContent = (source.value === "table" ? "Tabulated range: " : "Input range: ") + range;
  }
  function clearResult() {
    clipboardResult = "";
    copy.hidden = true;
    copy.textContent = "Copy result";
    error.textContent = "";
    const hint = document.createElement("p");
    hint.className = "panel-body muted";
    hint.textContent = "Enter a value and click Calculate.";
    resultArea.replaceChildren(hint);
  }
  function render(result, settings) {
    const reverse = settings.direction === "temperature";
    const panel = document.createElement("div");
    panel.className = "metric";
    const pressure = display(result.pressure) + " kPa";
    const temperature = display(result.temperature) + " \xB0C";
    clipboardResult = reverse ? temperature : pressure;
    const title = document.createElement("p");
    title.className = "result-title";
    title.textContent = reverse ? "Saturation temperature" : "Saturation pressure";
    const reading = document.createElement("p");
    reading.className = "metric-value";
    reading.textContent = clipboardResult;
    const input = document.createElement("p");
    input.className = "result-meta";
    input.textContent = reverse ? pressure + " absolute" : temperature;
    panel.append(title, reading, input);
    if (result.extrapolated || settings.source === "equation") {
      const context = document.createElement("p");
      context.className = "result-meta";
      context.textContent = result.extrapolated ? "Extrapolated from MATLAB data" : "Saved ASHRAE equation result";
      panel.append(context);
    }
    resultArea.replaceChildren(panel);
    copy.hidden = false;
  }
  function restoreCalculation({ settings, result }) {
    if (settings.source === "moist-air") {
      throw new Error("This saved calculation used the earlier moist-air dataset. Use Copy to retrieve its values.");
    }
    direction.value = settings.direction;
    source.value = settings.source === "equation" ? "textbook" : settings.source;
    updateInput(settings.unit);
    value.value = settings.value;
    updateOptions();
    clearResult();
    render(result, settings);
  }
  var history = createHistory("water-saturation-history", { restore: restoreCalculation });
  byId("lookup").addEventListener("submit", (event) => {
    event.preventDefault();
    clearResult();
    try {
      const settings = {
        direction: direction.value,
        source: source.value,
        unit: unit.value,
        value: value.value
      };
      const selectedUnit = inputUnits()[settings.unit];
      const base = selectedUnit.toBase(value.valueAsNumber);
      const result = calculate(base, settings.direction, settings.source);
      render(result, settings);
      const summary = settings.value + " " + selectedUnit.label + " \u2192 " + clipboardResult;
      history.add(summary, { settings, result }, clipboardResult);
    } catch (failure) {
      error.textContent = failure.message;
    }
  });
  byId("give-example").addEventListener("click", () => {
    clearResult();
    const exampleTemperature = 25;
    const base = usesTemperature() ? exampleTemperature : calculate(exampleTemperature, "pressure", source.value).pressure;
    value.value = inputUnits()[unit.value].fromBase(base);
    updateOptions();
  });
  direction.addEventListener("change", () => {
    updateInput();
    value.value = "";
    updateOptions();
    clearResult();
  });
  for (const element of [source, unit]) element.addEventListener("change", () => {
    updateOptions();
    clearResult();
  });
  value.addEventListener("input", clearResult);
  copy.addEventListener("click", async () => {
    const text = clipboardResult;
    const copied = await copyText(text);
    if (text === clipboardResult) copy.textContent = copied ? "Copied" : "Copy failed";
  });
  var initialDirection = byId("lookup").dataset.direction;
  if (initialDirection) direction.value = initialDirection;
  updateInput();
  updateOptions();
  byId("calculate").disabled = false;
  byId("lookup").dataset.initialized = "true";
})();
