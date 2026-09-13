import shap  # type: ignore
import xgboost as xgb  # type: ignore
import pandas as pd
import numpy as np

class Explainer:
    def __init__(self, model_path):
        self.model = xgb.XGBClassifier()
        self.model.load_model(model_path)
        # TreeExplainer is ideal for XGBoost
        self.explainer = shap.TreeExplainer(self.model)
        self.feature_names = [
            'S_temporal', 'S_seasonal', 'S_change', 'S_multivariate',
            'S_spatial', 'S_history', 'S_physics', 'C_spatial',
            'C_temporal', 'C_multivariate', 'P_persistence'
        ]
        self.human_names = {
            'S_temporal': 'Temporal',
            'S_seasonal': 'Seasonal',
            'S_change': 'Change',
            'S_multivariate': 'Multivariate',
            'S_spatial': 'Spatial',
            'S_history': 'History',
            'S_physics': 'Physics',
            'C_spatial': 'Spatial Coherence',
            'C_temporal': 'Temporal Coherence',
            'C_multivariate': 'Multivariate Coherence',
            'P_persistence': 'Persistence'
        }

    def explain(self, evidence_vector, predicted_class):
        # Convert dictionary to DataFrame
        df = pd.DataFrame([evidence_vector], columns=self.feature_names)
        
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(df)
        
        # shap_values for multiclass is a list of arrays (one per class)
        if isinstance(shap_values, list):
            class_shap = shap_values[predicted_class][0]
        else:
            # Depending on XGBoost/SHAP version, might be single array for binary or multi-dimensional
            if len(shap_values.shape) == 3:
                class_shap = shap_values[0, :, predicted_class]
            else:
                class_shap = shap_values[0]

        contributions = []
        for i, feat in enumerate(self.feature_names):
            val = float(class_shap[i])
            # Determine contribution direction
            if predicted_class in [1, 2]: # Uncertain or Fault
                impact = "increases_fault_risk" if val > 0 else "supports_genuine"
            else:
                impact = "supports_genuine" if val > 0 else "increases_fault_risk"
                
            contributions.append({
                "feature": feat,
                "label": self.human_names.get(feat, feat),
                "shapValue": val,
                "impact": impact,
                "description": f"Analyzed {self.human_names.get(feat, feat)}"
            })
            
        # Sort by absolute SHAP value
        contributions.sort(key=lambda x: abs(x["shapValue"]), reverse=True)
        return contributions
