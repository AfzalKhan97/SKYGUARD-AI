import pandas as pd
import xgboost as xgb  # type: ignore
import json
from .preprocessing import load_and_preprocess_data, chronological_split
from .evaluation import compute_metrics
from .features import FeatureExtractor
import os

def run_ablation_experiment(name, features_to_remove, train_df, val_df, historical_df, scenario_df, full_features):
    print(f"\nRunning Ablation: {name}")
    features = [f for f in full_features if f not in features_to_remove]
    
    X_train = train_df[features]
    y_train = train_df['label']
    X_val = val_df[features]
    y_val = val_df['label']
    
    model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=3,
        eval_metric='mlogloss',
        early_stopping_rounds=10,
        random_state=42
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    class_names = {0: "Genuine Weather", 1: "Uncertain", 2: "Sensor Fault"}
    
    # Historical Holdout
    hist_pred = model.predict(historical_df[features])
    hist_metrics = compute_metrics(historical_df['label'], hist_pred, class_names)
    
    # Scenario Evaluation
    scen_pred = model.predict(scenario_df[features])
    scen_metrics = compute_metrics(scenario_df['label'], scen_pred, class_names)
    
    return {
        "Experiment": name,
        "Removed_Features": features_to_remove,
        "Historical_Macro_F1": hist_metrics["macro_f1"],
        "Historical_Weighted_F1": hist_metrics["weighted_f1"],
        "Scenario_Macro_F1": scen_metrics["macro_f1"],
        "Scenario_Weighted_F1": scen_metrics["weighted_f1"],
        "Scenario_Fault_Recall": scen_metrics["per_class"]["Sensor Fault"]["recall"] if "Sensor Fault" in scen_metrics.get("per_class", {}) else 0.0,
        "Scenario_Uncertain_Recall": scen_metrics["per_class"]["Uncertain"]["recall"] if "Uncertain" in scen_metrics.get("per_class", {}) else 0.0
    }

def run_ablation_study():
    print("Starting Ablation Study...")
    
    data_path = r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\SkyGuard_Ready_Dataset\skyguard_training_demo_dataset.csv"
    df = load_and_preprocess_data(data_path)
    
    train_df, val_df, test_df = chronological_split(df)
    
    extractor = FeatureExtractor()
    extractor.fit_global_stats(train_df)
    
    print("Extracting features (this may take a moment)...")
    df_features = extractor.extract_features(df)
    
    train_df = df_features.loc[train_df.index]
    val_df = df_features.loc[val_df.index]
    test_df = df_features.loc[test_df.index]
    
    historical_df = test_df.copy()
    scenario_df = df_features[df_features['is_injected'] == True].copy()
    
    FEATURES = [
        'S_temporal', 'S_seasonal', 'S_change', 'S_multivariate',
        'S_spatial', 'S_history', 'S_physics', 'C_spatial',
        'C_temporal', 'C_multivariate', 'P_persistence'
    ]
    
    experiments = [
        {"name": "A. Full 11D Evidence Vector", "remove": []},
        {"name": "B. Without spatial evidence", "remove": ['S_spatial', 'C_spatial']},
        {"name": "C. Without temporal evidence", "remove": ['S_temporal', 'S_change', 'C_temporal', 'S_seasonal', 'S_history', 'P_persistence']},
        {"name": "D. Without multivariate evidence", "remove": ['S_multivariate', 'C_multivariate']},
        {"name": "E. Without coherence evidence", "remove": ['C_spatial', 'C_temporal', 'C_multivariate']}
    ]
    
    results = []
    for exp in experiments:
        res = run_ablation_experiment(exp["name"], exp["remove"], train_df, val_df, historical_df, scenario_df, FEATURES)
        results.append(res)
        
    results_df = pd.DataFrame(results)
    
    out_dir = r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\evaluation"
    os.makedirs(out_dir, exist_ok=True)
    
    results_df.to_csv(os.path.join(out_dir, "ablation_results.csv"), index=False)
    
    with open(os.path.join(out_dir, "ablation_results.json"), "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"Saved ablation results to {out_dir}")

if __name__ == "__main__":
    run_ablation_study()
