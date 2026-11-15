# FireLedger

Static GitHub Pages frontend for Canadian wildfire situational awareness.

## Scope
- Canada only
- Calendar year 2023 only
- Map initially centered on Canada
- Responder profiles: firefighter, ambulance/medical, emergency responder, scientist/analyst, and land manager

## GitHub Pages
In repository Settings → Pages, choose **Deploy from a branch**, select **main**, and select **/(root)**.

## Current data state
The frontend is intentionally usable before the observation dataset is ready. It looks for:

`data/fire_observations.geojson`

Expected format: GeoJSON FeatureCollection with Point features. Each feature should include a date field (`acq_date`, `date`, or `datetime`) and may include `frp`, `near_population`, or `population_proximity`.

The frontend applies a 2023 date filter and a broad Canada coordinate envelope. The production data-preparation pipeline must apply an authoritative Canada boundary geometry before publishing; a bounding box alone is not a definitive national-boundary test.

## Architecture and security
This repository is a static website. Do not put GitHub tokens, Hugging Face tokens, Kaggle credentials, private SQLite files, or other secrets in frontend files. GitHub Pages cannot securely write to a private GitHub repository or execute a Kaggle notebook. The Kaggle worker and the database repository remain separate components; a secure request-submission mechanism must be selected before enabling public chat or live writes.

FRP is fire radiative power and must not be presented as fireline intensity. Population-proximity flags are screening indicators, not proof of exposure. Inferred fuel/land-cover context must be labelled as inferred, not confirmed fire type.
