# Olympus Walk

**A Mars expedition planner built for NASA Space Apps Challenge 2026.**

[Try Olympus Walk](https://olympus-walk.vercel.app)

## What is Olympus Walk?

Planning a route on Mars involves more than drawing a line between two points. Terrain changes, steep slopes and the location of science stops all affect the path an explorer might take. The information needed to study those factors is also spread across different missions and datasets.

Olympus Walk brings some of that information together in one interactive map. Our prototype focuses on a small area of **Gale Crater, near Mount Sharp**, and lets users explore the terrain, choose science stops and calculate routes for walking or rover travel.

We built it as a way to turn planetary data into something easier to explore and explain, not as a navigation system for real missions.

## What you can do

- **Explore Gale Crater.** Switch between NASA Mars Trek imagery from CTX, Viking, MOLA and THEMIS (daytime and nighttime).
- **Inspect the terrain.** View elevation and slope information derived from a USGS digital elevation model (DEM).
- **Plan a route.** Choose science stops, switch between walking and rover modes, and calculate a route with A*.
- **Read the elevation profile.** Follow the changes in terrain elevation along the selected route.
- **Try the exploration HUD.** Simulate progress along a calculated route and inspect its estimated metrics.
- **Check Mars conditions.** Read a historical Curiosity REMS observation from Gale Crater, with its date and source.
- **Learn about planetary protection.** Review background information and guidance, including why the route itself is marked *Not evaluated*.
- **Ask the Route Assistant.** Get built-in explanations of distance, slope, elevation, estimated EVA time and route limitations. It works without a generative AI service.

## How route planning works

The map uses an elevation grid derived from the **USGS MSL Gale Merged DEM**. We extracted the portion covering our study area and processed it into a **237 × 237 grid**, with cells approximately **25 m** across.

From that grid, the application reads elevation values and calculates slope. The A* algorithm uses the selected travel mode and its configured slope limit to search for a route between the chosen stops. The result is shown on the map together with an elevation profile and estimated travel metrics.

The grid contains real elevation data, but the mission setup is illustrative: our base and science stops are approximate, and the speed, EVA time, radiation dose and operational thresholds are **design assumptions**.

You can inspect the processing method, dataset references and limitations in [`docs/data-sources.md`](docs/data-sources.md).

## Data sources

| Data | Source | How we use it |
| --- | --- | --- |
| Orbital imagery and visual layers | [NASA/JPL Mars Trek](https://trek.nasa.gov/mars/) | CTX, Viking, MOLA and THEMIS map layers |
| Terrain elevation | USGS MSL Gale Merged DEM | Elevation grid, derived slope and route profile |
| Historical atmospheric observations | [NASA Curiosity REMS feed](https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json) | Dated air and ground temperatures and pressure, when available |
| Planetary protection references | NASA, COSPAR and National Academies | Informational guidance, not automatic geographic classification |

The THEMIS layers are **infrared images, not numerical temperature maps**. Some imagery also has a lower native resolution than CTX, so it will look blurred when enlarged. We show these limitations instead of implying that zooming adds new detail.

The detailed source links and processing notes are kept in [`docs/data-sources.md`](docs/data-sources.md).

## Built with

- **React and JavaScript** for the interface and application logic
- **Vite** for local development and builds
- **Leaflet and React Leaflet** for the interactive map
- **CSS** for the responsive layout
- **Python, NumPy and Pillow** for the DEM extraction workflow
- **Vercel** for hosting the web application

## Run it locally

You'll need Node.js and npm installed.

```bash
# Install dependencies
npm ci

# Start the development server
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

To build and preview the production version:

```bash
npm run build
npm run preview
```

To run the terrain grid and route checks:

```bash
node scripts/check_grid.mjs
```

The processed elevation grid is already included in the repository, so **you do not need to download the original DEM** to run the application. The extraction script is available in `scripts/` for anyone who wants to study the workflow. NASA imagery requires a connection to the external map services.

## Project structure

```text
public/                 Static assets
scripts/                DEM extraction, conditions fetch and grid checks
src/
  components/           Map, panels, assistant, HUD and elevation profile
  data/                 Mission configuration, map layers and processed data
  lib/                  Grid utilities, A* and route explanations
docs/                   Scientific sources, methods and known issues
```

## What this prototype does not do

Olympus Walk is an educational and exploratory prototype. It **does not certify a route as safe** for astronauts or rovers.

- The A* calculation considers modeled terrain constraints, but not every hazard, such as small rocks, unstable soil or unseen obstacles.
- The elevation grid is averaged to about 25 m per cell, which can hide smaller terrain features.
- The base and science stops have not been independently validated as operational destinations.
- EVA time, radiation dose, speeds and limits are illustrative assumptions, not verified mission requirements.
- REMS measurements shown in the app are historical, not live weather conditions at the proposed route.
- Planetary protection status is **Not evaluated**; the app does not classify or map validated Special Regions along the route.
- The Route Assistant uses local responses based on calculated results. Gemini or another generative AI model is **not connected**.

These boundaries matter because real scientific data does not automatically make every conclusion or operational estimate reliable.

## About the project

Olympus Walk was developed by our team for **NASA Space Apps Challenge 2026**. We wanted to combine software development with publicly available Mars data and build something people could actually interact with.

This repository contains the application, the processed terrain grid and the scripts used to prepare or check part of the data. The Git history documents how the prototype evolved through separate branches and integrations.

**Live app:** https://olympus-walk.vercel.app
