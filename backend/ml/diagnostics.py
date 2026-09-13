import pandas as pd

class DiagnosticsEngine:
    def __init__(self):
        # We can store historical trust scores per station if needed
        self.station_trust = {}

    def get_root_cause(self, evidence_vector, predicted_class, shap_contributions):
        """
        Determine the root cause based on SHAP contributions and evidence vector.
        0 = Genuine Weather, 1 = Uncertain, 2 = Sensor Fault
        """
        if predicted_class == 0:
            # Genuine Weather
            if evidence_vector.get('S_spatial', 0) < 0.3 and evidence_vector.get('S_multivariate', 0) > 0.6:
                return "Regional Weather Event"
            return "none"
            
        elif predicted_class == 2:
            # Fault - Check top SHAP contribution
            if shap_contributions:
                top_feat = shap_contributions[0]['feature']
                if top_feat == 'Persistence':
                    return "Frozen Sensor"
                elif top_feat == 'Change':
                    return "Erratic/Noise"
                elif top_feat == 'Temporal':
                    if evidence_vector.get('S_history', 0) > 0.5:
                        return "Sensor Drift"
                    else:
                        return "Spike"
                elif top_feat == 'History' and evidence_vector.get('S_history', 0) == 1.0:
                    return "Communication Failure"
            
            return "Unspecified Sensor Fault"
            
        else:
            # Uncertain
            return "Ambiguous Data Signature"

    def calculate_sensor_trust(self, station_id, current_trust, predicted_class, evidence_vector):
        """
        Calculate sequential sensor trust (0-100).
        """
        if current_trust is None:
            current_trust = 100.0
            
        # Adjust based on predicted class
        if predicted_class == 2: # Fault
            # Penalize heavily for severe faults
            penalty = 15.0
            # If it's a spike, maybe less penalty
            if evidence_vector.get('S_change', 0) > 0.8:
                penalty = 25.0 # Sharp spike
            current_trust = max(0.0, current_trust - penalty)
        elif predicted_class == 0:
            # Recover slowly if normal
            current_trust = min(100.0, current_trust + 2.0)
        else:
            # Uncertain - slight degrade
            current_trust = max(0.0, current_trust - 5.0)
            
        # Determine trend
        if station_id not in self.station_trust:
            self.station_trust[station_id] = []
        self.station_trust[station_id].append(current_trust)
        
        # Keep last 5 for trust trend
        if len(self.station_trust[station_id]) > 5:
            self.station_trust[station_id].pop(0)
            
        history = self.station_trust[station_id]
        if len(history) > 1:
            if history[-1] > history[0] + 5:
                trend = 'improving'
            elif history[-1] < history[0] - 5:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
            
        return {
            "trust_score": float(current_trust),
            "trend": trend
        }

    def calculate_degradation(self, station_id, predicted_class, evidence_vector, root_cause):
        """
        Calculates degradation status based on persistent/repeated evidence.
        State transitions: Normal -> Watch -> Maintenance Recommended
        Configurable thresholds:
        - risk_score increases by 20 for each consecutive persistent fault.
        - risk_score increases by 5 for uncertain or single spikes.
        - risk_score decreases by 10 for genuine observations.
        - max risk_score is 100.
        """
        if not hasattr(self, 'station_degradation_risk'):
            self.station_degradation_risk = {}
            
        current_risk = self.station_degradation_risk.get(station_id, 0.0)
        
        if predicted_class == 2:
            # Persistent fault types increase risk significantly
            if root_cause in ["Frozen Sensor", "Sensor Drift", "Bias"]:
                current_risk = min(100.0, current_risk + 20.0)
            else:
                # Isolated spike or erratic noise
                current_risk = min(100.0, current_risk + 10.0)
        elif predicted_class == 1:
            # Uncertain / watch
            current_risk = min(100.0, current_risk + 5.0)
        else:
            # Genuine - recovers over time
            current_risk = max(0.0, current_risk - 15.0)
            
        self.station_degradation_risk[station_id] = current_risk
        
        # Thresholds:
        # 0-39: Normal
        # 40-79: Watch
        # 80-100: Maintenance Recommended
        if current_risk >= 80:
            status = 'Maintenance Recommended'
            reason = 'maintenance recommended based on persistent anomalous behavior'
        elif current_risk >= 40:
            status = 'Watch'
            reason = 'degradation indication'
        else:
            status = 'Normal'
            reason = 'operating normally'
            
        return {
            "status": status,
            "risk_score": float(current_risk),
            "reason": reason,
            "persistence": 1 if current_risk > 0 else 0
        }
