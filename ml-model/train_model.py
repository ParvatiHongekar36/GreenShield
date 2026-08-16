import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ============================================================
# STEP 1: Generate a larger, realistic SYNTHETIC dataset
# ============================================================
# NOTE: This data is synthetically generated using logical
# environmental rules (not real historical records). This is
# a common and accepted approach for student ML projects when
# real large-scale labeled disaster data isn't available.

np.random.seed(42)
NUM_SAMPLES = 500

temperature = np.random.uniform(10, 48, NUM_SAMPLES)
humidity = np.random.uniform(5, 95, NUM_SAMPLES)
rainfall = np.random.exponential(scale=30, size=NUM_SAMPLES)
rainfall = np.clip(rainfall, 0, 200)
aqi = np.random.uniform(20, 350, NUM_SAMPLES)


def compute_flood_risk(rain, hum):
    score = (rain / 200) * 0.7 + (hum / 100) * 0.3
    score += np.random.normal(0, 0.07)  # small noise
    if score < 0.35:
        return 0  # Low
    elif score < 0.6:
        return 1  # Medium
    else:
        return 2  # High


def compute_wildfire_risk(temp, hum, aqi_val):
    score = (temp / 50) * 0.5 + ((100 - hum) / 100) * 0.3 + (aqi_val / 350) * 0.2
    score += np.random.normal(0, 0.07)  # small noise
    if score < 0.4:
        return 0  # Low
    elif score < 0.65:
        return 1  # Medium
    else:
        return 2  # High


flood_risk = [
    compute_flood_risk(r, h) for r, h in zip(rainfall, humidity)
]

wildfire_risk = [
    compute_wildfire_risk(t, h, a) for t, h, a in zip(temperature, humidity, aqi)
]

df = pd.DataFrame({
    'temperature': temperature,
    'humidity': humidity,
    'rainfall': rainfall,
    'aqi': aqi,
    'flood_risk': flood_risk,
    'wildfire_risk': wildfire_risk,
})

# ============================================================
# STEP 2: Split into training and testing sets
# ============================================================

X = df[['temperature', 'humidity', 'rainfall', 'aqi']]

X_train, X_test, y_flood_train, y_flood_test = train_test_split(
    X, df['flood_risk'], test_size=0.2, random_state=42
)

_, _, y_fire_train, y_fire_test = train_test_split(
    X, df['wildfire_risk'], test_size=0.2, random_state=42
)

# ============================================================
# STEP 3: Train models
# ============================================================

flood_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    random_state=42
)
flood_model.fit(X_train, y_flood_train)

fire_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    random_state=42
)
fire_model.fit(X_train, y_fire_train)

# ============================================================
# STEP 4: Evaluate models (for your viva / documentation)
# ============================================================

flood_preds = flood_model.predict(X_test)
fire_preds = fire_model.predict(X_test)

print("=" * 50)
print("FLOOD MODEL EVALUATION")
print("=" * 50)
print(f"Accuracy: {accuracy_score(y_flood_test, flood_preds):.2%}")
print(classification_report(y_flood_test, flood_preds, target_names=['Low', 'Medium', 'High'], zero_division=0))

print("=" * 50)
print("WILDFIRE MODEL EVALUATION")
print("=" * 50)
print(f"Accuracy: {accuracy_score(y_fire_test, fire_preds):.2%}")
print(classification_report(y_fire_test, fire_preds, target_names=['Low', 'Medium', 'High'], zero_division=0))

# ============================================================
# STEP 5: Save trained models (same filenames as before)
# ============================================================

joblib.dump(flood_model, 'flood_model.pkl')
joblib.dump(fire_model, 'fire_model.pkl')

print("=" * 50)
print("Flood model saved successfully!")
print("Wildfire model saved successfully!")
print(f"Trained on {NUM_SAMPLES} synthetic samples ({len(X_train)} train / {len(X_test)} test).")
print("Models are ready.")