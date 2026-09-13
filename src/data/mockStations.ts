// Re-export verified GHCNh dataset as the single source of truth
export { 
  GHCNH_STATIONS as initialStations, 
  GHCNH_ANOMALIES as initialAnomalies,
  DATASET_VALIDATION_REPORT as datasetReport,
  GHCNH_SCENARIOS as anomalyScenarios
} from './ghcnhDataset';
