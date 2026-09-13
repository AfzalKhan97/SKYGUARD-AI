import pandas as pd
import numpy as np
from scipy.spatial.distance import mahalanobis  # pyright: ignore[reportMissingImports]
from numpy.linalg import inv

class FeatureExtractor:
    def __init__(self, df_metadata=None):
        self.history = {} # station_id -> deque of recent observations
        self.metadata = df_metadata
        self.global_means = {}
        self.global_cov_inv = None

    def fit_global_stats(self, df_train):
        """Fit global multivariate statistics for Mahalanobis distance."""
        # Use T, P, RH
        vars_to_use = ['temperature_c', 'pressure_hpa', 'relative_humidity_pct']
        df_clean = df_train[vars_to_use].dropna()
        if not df_clean.empty:
            self.global_means = df_clean.mean().to_dict()
            cov_matrix = df_clean.cov().values + np.eye(3) * 1e-4
            try:
                self.global_cov_inv = inv(cov_matrix)
            except:
                self.global_cov_inv = np.eye(3)

    def extract_features(self, df):
        """Extract features for a whole dataframe (used for training)."""
        df = df.sort_values(by=['timestamp'])
        
        # We will build features incrementally to simulate online streaming
        features_list = []
        
        # Keep a rolling window per station
        window_size = 8 * 14 # 8 obs/day * 14 days = 112 obs
        station_history = {st: [] for st in df['station_id'].unique()}
        
        # For spatial we need the latest reading of each station
        latest_spatial = {}

        for _, row in df.iterrows():
            st_id = row['station_id']
            ts = row['timestamp']
            
            # Update spatial latest
            latest_spatial[st_id] = {
                'temperature_c': row.get('temperature_c'),
                'pressure_hpa': row.get('pressure_hpa'),
                'relative_humidity_pct': row.get('relative_humidity_pct')
            }
            
            ev = self.compute_evidence(row, station_history[st_id], latest_spatial)
            features_list.append(ev)
            
            # Update history
            station_history[st_id].append(row.to_dict())
            if len(station_history[st_id]) > window_size:
                station_history[st_id].pop(0)

        ev_df = pd.DataFrame(features_list)
        return pd.concat([df.reset_index(drop=True), ev_df], axis=1)
        
    def compute_evidence(self, row, history, latest_spatial):
        """
        Compute the 11D Evidence Vector for a single observation.
        All values are normalized [0, 1].
        """
        ev = {
            'S_temporal': 0.0,
            'S_seasonal': 0.0,
            'S_change': 0.0,
            'S_multivariate': 0.0,
            'S_spatial': 0.0,
            'S_history': 0.0,
            'S_physics': 0.0,
            'C_spatial': 0.0,
            'C_temporal': 0.0,
            'C_multivariate': 0.0,
            'P_persistence': 0.0
        }
        
        t_val = row.get('temperature_c')
        p_val = row.get('pressure_hpa')
        rh_val = row.get('relative_humidity_pct')
        
        if pd.isna(t_val) and pd.isna(rh_val):
            # Communication failure or missing data
            ev['S_temporal'] = 1.0 # High anomaly
            return ev

        # 1. Temporal Evidence (Deviation from median using MAD)
        if len(history) > 5 and not pd.isna(t_val):
            recent_t = [h['temperature_c'] for h in history[-24:] if not pd.isna(h['temperature_c'])]
            if len(recent_t) > 3:
                median_t = np.median(recent_t)
                mad_t = np.median(np.abs(recent_t - median_t))
                if mad_t == 0: mad_t = 0.1
                z = np.abs(t_val - median_t) / (1.4826 * mad_t + 1e-5)
                ev['S_temporal'] = 1.0 - np.exp(-(z**2) / 2)

        # 2. Change Evidence
        if len(history) > 0:
            prev_t = history[-1].get('temperature_c')
            if not pd.isna(t_val) and prev_t is not None and not pd.isna(prev_t):
                delta_t = abs(t_val - prev_t)
                # Normalize by assuming max normal 3-hour delta is 8.0
                ev['S_change'] = min(1.0, delta_t / 8.0)
                
        # 3. Seasonal (Compare to same hour of day)
        if len(history) > 10 and not pd.isna(t_val):
            try:
                hour = row['timestamp'].hour
                same_hour_t = [h['temperature_c'] for h in history if h['timestamp'].hour == hour and not pd.isna(h['temperature_c'])]
                if len(same_hour_t) > 2:
                    sh_median = np.median(same_hour_t)
                    ev['S_seasonal'] = min(1.0, abs(t_val - sh_median) / 10.0)
            except:
                pass
                
        # 4. Multivariate Evidence (Mahalanobis Distance)
        if not pd.isna(t_val) and not pd.isna(p_val) and not pd.isna(rh_val) and self.global_cov_inv is not None:
            vec = np.array([t_val, p_val, rh_val])
            mean_vec = np.array([self.global_means['temperature_c'], self.global_means['pressure_hpa'], self.global_means['relative_humidity_pct']])
            try:
                dist = mahalanobis(vec, mean_vec, self.global_cov_inv)
                # Cap and scale to [0, 1]
                ev['S_multivariate'] = min(1.0, dist / 10.0)
            except:
                pass

        # 5. Spatial Evidence
        spatial_diffs = []
        st_id = row['station_id']
        if not pd.isna(t_val):
            for k, v in latest_spatial.items():
                if k != st_id and v['temperature_c'] is not None and not pd.isna(v['temperature_c']):
                    spatial_diffs.append(abs(t_val - v['temperature_c']))
        if spatial_diffs:
            min_diff = min(spatial_diffs)
            ev['S_spatial'] = min(1.0, min_diff / 10.0)
            ev['C_spatial'] = max(0.0, 1.0 - (min_diff / 5.0)) # Coherence is inverse
        else:
            ev['S_spatial'] = 0.5 # Neutral
            ev['C_spatial'] = 0.5

        # 6. History Evidence
        # If there have been recent large changes/missing
        missing_count = sum(1 for h in history[-8:] if pd.isna(h['temperature_c']))
        ev['S_history'] = min(1.0, missing_count / 8.0)

        # 7. Physics (e.g. T > 50 or RH > 100 is physically unlikely in normal conditions)
        if not pd.isna(t_val):
            if t_val > 50 or t_val < -10:
                ev['S_physics'] = 1.0
            else:
                ev['S_physics'] = 0.1
                
        # 8. Temporal Coherence (Smoothness)
        ev['C_temporal'] = max(0.0, 1.0 - ev['S_change'])

        # 9. Multivariate Coherence (T drops, RH rises is coherent)
        if len(history) > 0:
            prev = history[-1]
            if not pd.isna(t_val) and not pd.isna(rh_val) and not pd.isna(prev['temperature_c']) and not pd.isna(prev['relative_humidity_pct']):
                dt = t_val - prev['temperature_c']
                drh = rh_val - prev['relative_humidity_pct']
                if dt * drh < 0: # Opposite directions = coherent
                    ev['C_multivariate'] = 1.0
                else:
                    ev['C_multivariate'] = 0.3 # Less coherent if both move same dir

        # 10. Persistence (Is value frozen?)
        if len(history) > 2 and not pd.isna(t_val):
            recent_3_t = [h['temperature_c'] for h in history[-3:]]
            if all(not pd.isna(v) for v in recent_3_t):
                if abs(max(recent_3_t) - min(recent_3_t)) < 0.05 and abs(t_val - recent_3_t[-1]) < 0.05:
                    ev['P_persistence'] = 1.0
                else:
                    ev['P_persistence'] = 0.1
        
        return ev
