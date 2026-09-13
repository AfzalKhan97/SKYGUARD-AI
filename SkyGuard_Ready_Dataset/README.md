# SkyGuard AI — Actual Ready Dataset Package

Prepared from the **five GHCNh 2023 station CSV files supplied by the team**.

## Final retained network

1. INM00042111 — DEHRADUN
2. INI0000VIDD — SAFDARJUNG (Delhi)
3. INI0000VIJO — JODHPUR

The supplied Jaipur file was **not retained** because its 2023 sea-level-pressure coverage was only 16.49%. Bangalore/Hindustan Airport was also rejected because its supplied 2023 file had 0% usable sea-level-pressure coverage.

## Files

### `skyguard_real_2023_3station_network.csv`
Real observations only.
- 8,760 aligned observations
- 3 Indian stations
- Common 3-hour grid covering 2023
- Temperature
- Relative humidity
- Sea-level pressure as the common pressure field

The source observations are not synthetic.

### `skyguard_strict_dehradun_station_pressure.csv`
A strict single-station dataset using **station-level pressure** for Dehradun. Use this when you specifically want to demonstrate the station-level-pressure version of the multivariate model.

### `skyguard_injected_scenarios_2023.csv`
Explicitly simulated evaluation scenarios:
- spike
- frozen/stuck
- drift
- sensor bias
- noise/erratic
- communication failure
- genuine regional event (SIMULATED)

### `skyguard_training_demo_dataset.csv`
Real baseline plus the labeled injected scenarios.

### `station_screening_report.csv`
Coverage and keep/reject decision for all five supplied station files.

### `station_metadata.csv`
Coordinates and pressure-field metadata for the retained network.

## Pressure decision

The SIH problem statement says **Atmospheric Pressure (hPa)**; it does not mandate station-level pressure.

For the multi-station network, SkyGuard uses **sea-level pressure** as the common `pressure_hpa` field because the retained stations do not all provide station-level pressure.

This is explicitly documented and is not hidden.

Dehradun's source station-level pressure is also preserved in the strict Dehradun file.

## Temporal/spatial alignment

The source stations report at different frequencies. For spatial consistency analysis, each retained station was aligned to a common 3-hour grid using the nearest source observation within 45 minutes. Long gaps were not interpolated.

## Simulated anomaly policy

Injected rows have:
- `is_injected = True`
- `scenario_id`
- `scenario_type`
- `target_class`
- `fault_type`
- `injection_magnitude`

The regional-weather scenario is **simulated and meteorologically plausible**. It is not presented as a verified historical extreme-weather event.

## Recommended prototype workflow

**Stage 1 — baseline**
Use `skyguard_real_2023_3station_network.csv` to calculate temporal, seasonal, multivariate and spatial evidence.

**Stage 2 — evaluation**
Run `skyguard_injected_scenarios_2023.csv` through the same pipeline.

**Stage 3 — fusion**
Build the Evidence Vector and train/evaluate the XGBoost fusion model.

**Stage 4 — demo**
Use the injected scenarios to demonstrate:
- spike detection
- frozen sensor detection
- drift detection
- communication failure
- genuine regional event vs isolated fault

## Source

NOAA/NCEI Global Historical Climatology Network-hourly (GHCNh), Version 1:
https://www.ncei.noaa.gov/products/global-historical-climatology-network-hourly

Dataset DOI:
https://doi.org/10.25921/jp3d-3v19

This package combines source-derived NOAA observations with clearly labeled simulated records for the SkyGuard SIH prototype.
