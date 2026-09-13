import os
import json
import xgboost as xgb  # type: ignore
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import pandas as pd
from .preprocessing import load_and_preprocess_data, chronological_split
from .features import FeatureExtractor
import datetime

FEATURES = [
    'S_temporal', 'S_seasonal', 'S_change', 'S_multivariate',
    'S_spatial', 'S_history', 'S_physics', 'C_spatial',
    'C_temporal', 'C_multivariate', 'P_persistence'
]

def train_and_evaluate():
    data_path = r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\SkyGuard_Ready_Dataset\skyguard_training_demo_dataset.csv"
    
    # 1. Load and Preprocess
    df = load_and_preprocess_data(data_path)
    
    # 2. Chronological Split
    train_df, val_df, test_df = chronological_split(df)
    
    # 3. Extract Features
    extractor = FeatureExtractor()
    extractor.fit_global_stats(train_df)
    
    # Extract on FULL contiguous dataframe to perfectly preserve temporal context
    # especially for injected scenarios that rely on previous normal history.
    df_features = extractor.extract_features(df)
    
    # Re-split using indices to get the fully-featured rows
    train_df = df_features.loc[train_df.index]
    val_df = df_features.loc[val_df.index]
    test_df = df_features.loc[test_df.index]
    
    X_train = train_df[FEATURES]
    y_train = train_df['label']
    
    X_val = val_df[FEATURES]
    y_val = val_df['label']
    
    # 4. Train XGBoost
    # Note: No artificial label injection needed due to new stratified split strategy
    xgb_model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=3,
        eval_metric='mlogloss',
        early_stopping_rounds=10,
        random_state=42
    )
    xgb_model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )
    
    # 5. Train Baseline (Random Forest)
    rf_model = RandomForestClassifier(random_state=42)
    rf_model.fit(X_train, y_train)
    
    # 6. Evaluation Sets
    # A: Historical Holdout
    historical_df = test_df.copy()
    historical_df['xgb_pred'] = xgb_model.predict(historical_df[FEATURES])
    historical_df['rf_pred'] = rf_model.predict(historical_df[FEATURES])
    
    xgb_acc_hist = accuracy_score(historical_df['label'], historical_df['xgb_pred'])
    rf_acc_hist = accuracy_score(historical_df['label'], historical_df['rf_pred'])
    
    # B: Scenario Evaluation
    scenario_df = df_features[df_features['is_injected'] == True].copy()
    scenario_df['xgb_pred'] = xgb_model.predict(scenario_df[FEATURES])
    scenario_df['rf_pred'] = rf_model.predict(scenario_df[FEATURES])
    
    # Save Models and Results
    os.makedirs(r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\models", exist_ok=True)
    os.makedirs(r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\evaluation", exist_ok=True)
    
    model_path = r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\models\skyguard_xgb.json"
    xgb_model.save_model(model_path)
    
    metadata = {
        "training_timestamp": str(datetime.datetime.now()),
        "features": FEATURES,
        "classes": {0: "Genuine Weather", 1: "Uncertain", 2: "Sensor Fault"},
        "xgboost_historical_accuracy": float(xgb_acc_hist),
        "random_forest_historical_accuracy": float(rf_acc_hist)
    }
    with open(r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\models\metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"XGBoost Historical Acc: {xgb_acc_hist:.4f}, RF Historical Acc: {rf_acc_hist:.4f}")
    
    # Save CSVs for evaluation script
    historical_df.to_csv(r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\evaluation\test_results.csv", index=False)
    scenario_df.to_csv(r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\evaluation\scenario_results.csv", index=False)

if __name__ == "__main__":
    train_and_evaluate()
