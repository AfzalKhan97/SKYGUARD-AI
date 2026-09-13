import pandas as pd
import json
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix
import os

def compute_metrics(y_true, y_pred, class_names):
    # Ensure y_true and y_pred contain all classes if possible, but handle if not
    labels_present = list(set(y_true) | set(y_pred))
    acc = accuracy_score(y_true, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred, labels=list(class_names.keys()), zero_division=0)
    
    metrics = {
        "accuracy": float(acc),
        "macro_f1": float(f1.mean()),
        "weighted_f1": float((f1 * support).sum() / support.sum()) if support.sum() > 0 else 0.0
    }
    
    per_class = {}
    for i, c_idx in enumerate(class_names.keys()):
        per_class[class_names[c_idx]] = {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i])
        }
            
    metrics["per_class"] = per_class
    
    cm = confusion_matrix(y_true, y_pred, labels=list(class_names.keys()))
    cm_dict = {}
    for i, c_idx1 in enumerate(class_names.keys()):
        cm_dict[class_names[c_idx1]] = {class_names[c_idx2]: int(cm[i][j]) for j, c_idx2 in enumerate(class_names.keys())}
            
    metrics["confusion_matrix"] = cm_dict
    return metrics

def evaluate_file(file_path, output_json, class_names):
    if not os.path.exists(file_path):
        return None
        
    df = pd.read_csv(file_path)
    y_true = df['label']
    
    results = {}
    if 'xgb_pred' in df.columns:
        results['XGBoost'] = compute_metrics(y_true, df['xgb_pred'], class_names)
    if 'rf_pred' in df.columns:
        results['RandomForest_Baseline'] = compute_metrics(y_true, df['rf_pred'], class_names)
        
    with open(output_json, "w") as f:
        json.dump(results, f, indent=2)
        
    return results

def evaluate_scenario_level(df, class_names):
    """Produces a scenario-level breakdown."""
    rows = []
    for scenario, group in df.groupby('scenario_type'):
        y_true = group['label']
        y_pred = group['xgb_pred']
        
        acc = accuracy_score(y_true, y_pred)
        pred_dist = y_pred.value_counts().to_dict()
        pred_dist_named = {class_names.get(k, k): v for k, v in pred_dist.items()}
        
        rows.append({
            "scenario_type": str(scenario),
            "sample_count": len(group),
            "correct_predictions": int((y_true == y_pred).sum()),
            "detection_rate": float(acc),
            "predicted_class_distribution": pred_dist_named
        })
    
    scen_df = pd.DataFrame(rows)
    scen_df.to_csv(r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\evaluation\scenario_confusion_matrix.csv", index=False)


def evaluate():
    base_dir = r"c:\Users\SANA'S PC\Downloads\SKYGUARD-AI-main\SKYGUARD-AI-main\backend\evaluation"
    class_names = {0: "Genuine Weather", 1: "Uncertain", 2: "Sensor Fault"}
    
    # 1. Historical Evaluation
    hist_results = evaluate_file(os.path.join(base_dir, "test_results.csv"), os.path.join(base_dir, "historical_metrics.json"), class_names)
    
    # 2. Scenario Evaluation
    scen_results = evaluate_file(os.path.join(base_dir, "scenario_results.csv"), os.path.join(base_dir, "scenario_metrics.json"), class_names)
    
    # Scenario breakdown
    scen_df = pd.read_csv(os.path.join(base_dir, "scenario_results.csv"))
    evaluate_scenario_level(scen_df, class_names)
    
    # Baseline comparison (using scenario metrics as the primary comparison for anomalies)
    if scen_results and 'XGBoost' in scen_results and 'RandomForest_Baseline' in scen_results:
        with open(os.path.join(base_dir, "baseline_comparison.json"), "w") as f:
            json.dump({
                "Historical_Holdout": hist_results,
                "Scenario_Evaluation": scen_results
            }, f, indent=2)

if __name__ == "__main__":
    evaluate()
