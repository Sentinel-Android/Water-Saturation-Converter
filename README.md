# Water Saturation Converter

An independent, static water saturation calculator, ready for GitHub Pages.

**Website:** https://watersaturationconverter.aditusan.dev/  
**Repository:** https://github.com/Sentinel-Android/Water-Saturation-Converter

The website uses the same layout, shared styles, and page-folder convention as [Psychrometric Tools](https://github.com/Sentinel-Android/Psychrometric-tools) and [ADI Solver](https://github.com/Sentinel-Android/ADI-Solver). It preserves the existing saturation data, interpolation, textbook correlations, units, and calculation history.

## Features

- Convert temperature to absolute saturation pressure, or pressure to saturation temperature.
- Choose the original MATLAB table with PCHIP interpolation/extrapolation or the original textbook equations.
- Temperature units: °C, °F, K. Pressure units: kPa, Pa, bar, MPa, psia.
- Give example, copy result, and save up to 20 calculations per calculator page, with Restore, Copy, and Clear history.
- Separate conversion pages, a quantity/method reference, privacy information, and a custom 404 page.
- Responsive layouts, labelled form controls, keyboard focus styles, and a skip link.
- All calculations run locally in the browser.

## Repository layout

| Path | Purpose |
| --- | --- |
| `docs/index.html` | Main calculator; supports both directions |
| `docs/temperature-to-pressure/index.html` | Temperature-to-pressure calculator |
| `docs/pressure-to-temperature/index.html` | Pressure-to-temperature calculator |
| `docs/reference/index.html` | Definitions, ranges, methods, and sources |
| `docs/privacy/index.html` | Browser storage and clipboard information |
| `docs/assets/site.css` | Shared design used by every page |
| `docs/assets/site.js` | Shared page behaviour |
| `docs/assets/calculator.js` | Ready-to-use calculator bundle |
| `docs/404.html` | Custom-domain error page |
| `docs/CNAME`, `docs/.nojekyll` | GitHub Pages configuration |
| `docs/robots.txt`, `docs/sitemap.xml` | Search-engine discovery |
| `src/` | Editable calculator, history, interpolation, and data modules |
| `scripts/build.mjs` | Rebuilds the calculator bundle |
| `tests/` | Numerical regression checks |

The entire publishable site is in **`docs/`**. No framework, server backend, CDN, or runtime package installation is required on GitHub Pages. Each project is self-contained; it does not load code or styles from the other sites.

## Publish on GitHub Pages

1. Replace this repository’s existing **`docs` folder** with the new `docs` folder. Remove the old flat assets and `local-preview.html` when replacing it so obsolete pages are not left published. Copy the accompanying root files and folders into this same repository.
2. Commit and push to `main` using GitHub Desktop or GitHub.
3. Open **Settings → Pages** in this repository.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose **`main`** and **`/docs`**, then save. If the default branch has a different name, choose that branch instead.
6. Keep the custom domain **`watersaturationconverter.aditusan.dev`**. The included `docs/CNAME` already contains it. Enable **Enforce HTTPS** when available.

The current custom-domain DNS configuration can remain in place when replacing the existing site. The sitemap is https://watersaturationconverter.aditusan.dev/sitemap.xml.

## Preview locally

Install Python 3, then double-click `Start-Local-Preview.bat` on Windows, or run `sh Start-Local-Preview.sh` on macOS/Linux. Open **http://localhost:8000/** while the preview process is running. Stop it with Ctrl+C.

Alternatively, run from this repository’s root:

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory docs
```

On macOS/Linux, use `python3` if `python` is unavailable. If running both project previews at once, use port `8001` for the second one. The standalone, duplicate `local-preview.html` has been replaced by this preview workflow.

## Editing and rebuilding

Edit page content in the corresponding `docs/.../index.html`. Edit `docs/assets/site.css` once to update the styling across every page. Every page loads `assets/site.js` as well.

For calculation or history changes, edit **`src/`**, then use Node.js 20.19+ or 22+:

```sh
npm ci
npm run build
npm test
```

Commit the updated source and generated `docs/assets/calculator.js`. These commands are only needed when developing the calculator; the supplied `docs` files are already built.

## Calculation details

- The MATLAB table contains the original 201 temperature/pressure pairs, spanning −60 to 160 °C and 0.00108 to 618.1392 kPa.
- As in the original MATLAB implementation, PCHIP is evaluated separately in each direction, including extrapolation. Extrapolated results are labelled.
- The textbook pressure equation accepts 0–200 °C. The direct textbook temperature correlation returns 0–93 °C and retains its original accepted pressure range.
- Pressure inputs are **absolute**, including psia. Gauge pressure is not an input option.
- The numerical modules and data are preserved from the existing repository. This redesign does not substitute a new physical model or extend the stated ranges.

## Sources and privacy

The on-site [reference](https://watersaturationconverter.aditusan.dev/reference/) retains the original textbook and ASHRAE source links. The original MATLAB sources are available in [Psychrometric Tools](https://github.com/Sentinel-Android/Psychrometric-tools/tree/main/MATLAB).

History uses browser IndexedDB, with a temporary tab-only fallback when storage is unavailable. Copy actions use the clipboard. No analytics or advertising scripts are included in this version; the on-site privacy page describes this behaviour.
