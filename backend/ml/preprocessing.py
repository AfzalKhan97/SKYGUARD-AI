import pandas as pd
import numpy as np

def load_and_preprocess_data(file_path):
    """
    Loads the SkyGuard dataset, handles duplicate observations by prioritizing
    injected scenarios, parses timestamps, and sorts chronologically.
    """
    df = pd.read_csv(file_path)
    
    # Ensure timestamp is datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort by station and time
    df = df.sort_values(by=['station_id', 'timestamp'])
    
    # The dataset contains injected scenarios that share the same timestamp
    # as the baseline real observations. We want to keep the injected ones
    # when there are duplicates, because they represent the labeled anomalies
    # we want to train on/evaluate against.
    # In the dataset, `is_injected` is True for the injected ones.
    # We can sort by `is_injected` so that True comes last, then drop_duplicates keeping the last.
    df = df.sort_values(by=['station_id', 'timestamp', 'is_injected'])
    df = df.drop_duplicates(subset=['station_id', 'timestamp'], keep='last')
    
    # Re-sort chronologically after deduplication
    df = df.sort_values(by=['timestamp', 'station_id']).reset_index(drop=True)
    
    # Handle labels
    # 0 = Genuine Weather, 1 = Uncertain / Monitor, 2 = Sensor/Data Fault
    class_map = {
        'normal': 0,
        'likely_genuine_event': 1,
        'sensor_data_anomaly': 2
    }
    
    if 'target_class' in df.columns:
        df['label'] = df['target_class'].map(class_map)
        # If any didn't map, fill with 1 (Uncertain)
        df['label'] = df['label'].fillna(1).astype(int)
        
    return df

from sklearn.model_selection import train_test_split

def chronological_split(df, test_ratio=0.15):
    """
    Splits the dataframe to prevent future information leakage for the final test set.
    The final test_ratio is strictly chronological.
    The remaining data (development set) is randomly stratified to ensure minority 
    classes are proportionally available for training XGBoost natively.
    Returns train, val, test dataframes.
    """
    # Sort globally by time to split across all stations at the same time point
    df_sorted = df.sort_values('timestamp')
    
    n = len(df_sorted)
    test_start = int(n * (1 - test_ratio))
    
    # 1. Strict chronological historical test set
    dev_df = df_sorted.iloc[:test_start].copy()
    test_df = df_sorted.iloc[test_start:].copy()
    
    # 2. Stratified split for development (to ensure all classes are in train natively)
    # Validation ratio inside development is approx 15/85 = 17.6% of dev set.
    train_df, val_df = train_test_split(
        dev_df, 
        test_size=0.1764, 
        stratify=dev_df['label'], 
        random_state=42
    )
    
    return train_df, val_df, test_df
