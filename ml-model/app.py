from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)  # allows your HTML/JS frontend to call this API

# Load trained models
flood_model = joblib.load("flood_model.pkl")
fire_model = joblib.load("fire_model.pkl")

RISK_LEVELS = {0: "Low", 1: "Medium", 2: "High"}


def compute_cyclone_risk(temperature, humidity, wind_speed):
    """Rule-based cyclone risk using temperature, humidity and wind speed."""
    score = 0
    if temperature >= 27:
        score += 1
    if temperature >= 30:
        score += 1
    if humidity >= 70:
        score += 1
    if wind_speed >= 62:   # tropical storm threshold km/h
        score += 1
    if wind_speed >= 88:   # cyclonic storm threshold
        score += 1

    if score >= 4:
        return "High", round(min(50 + (score - 3) * 15, 95), 1)
    elif score >= 2:
        return "Medium", round(30 + score * 8, 1)
    else:
        return "Low", round(max(5, score * 10), 1)


def get_flood_zone(rainfall, elevation_m):
    """Classify flood zone based on rainfall and elevation."""
    if elevation_m is None:
        elevation_m = 50
    if elevation_m <= 10 and rainfall >= 30:
        return "Zone A"  # High risk
    elif elevation_m <= 30 and rainfall >= 20:
        return "Zone B"  # Moderate risk
    elif elevation_m <= 50 and rainfall >= 50:
        return "Zone B"
    else:
        return "Zone C"  # Low risk


def get_confidence(model, features):
    """Return the model's top class probability as a percentage, or None."""
    try:
        return round(float(max(model.predict_proba(features)[0])) * 100, 1)
    except Exception:
        return None


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "GreenShield ML API is running",
        "endpoints": ["/health (GET)", "/predict (POST)"],
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "GreenShield ML API is running"})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Send a JSON body"}), 400

    temperature = data.get("temperature")
    humidity = data.get("humidity")
    rainfall = data.get("rainfall")
    aqi = data.get("aqi")
    wind_speed = data.get("windSpeed", 20)    # km/h, optional
    elevation = data.get("elevation", None)   # metres, optional

    if None in [temperature, humidity, rainfall, aqi]:
        return jsonify({"error": "temperature, humidity, rainfall and aqi are required"}), 400

    # Make sure all values are numbers
    try:
        temperature = float(temperature)
        humidity = float(humidity)
        rainfall = float(rainfall)
        aqi = float(aqi)
        wind_speed = float(wind_speed)
        elevation = float(elevation) if elevation is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "All values must be numbers"}), 400

    features = [[temperature, humidity, rainfall, aqi]]

    flood_idx = int(flood_model.predict(features)[0])
    fire_idx = int(fire_model.predict(features)[0])

    flood_confidence = get_confidence(flood_model, features)
    fire_confidence = get_confidence(fire_model, features)

    cyclone_risk, cyclone_confidence = compute_cyclone_risk(temperature, humidity, wind_speed)
    flood_zone = get_flood_zone(rainfall, elevation)

    return jsonify({
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": rainfall,
        "aqi": aqi,
        "windSpeed": wind_speed,
        "floodRisk": RISK_LEVELS.get(flood_idx, str(flood_idx)),
        "floodConfidence": flood_confidence,
        "wildfireRisk": RISK_LEVELS.get(fire_idx, str(fire_idx)),
        "wildfireConfidence": fire_confidence,
        "cycloneRisk": cyclone_risk,
        "cycloneConfidence": cyclone_confidence,
        "floodZone": flood_zone,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)