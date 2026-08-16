from flask import Flask, request, jsonify
import joblib
import os

app = Flask(__name__)

# Load trained models
flood_model = joblib.load("flood_model.pkl")
fire_model = joblib.load("fire_model.pkl")


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    temperature = data.get("temperature")
    humidity = data.get("humidity")
    rainfall = data.get("rainfall")
    aqi = data.get("aqi")

    if None in [temperature, humidity, rainfall, aqi]:
        return jsonify({
            "error": "temperature, humidity, rainfall and aqi are required"
        }), 400

    features = [[
        temperature,
        humidity,
        rainfall,
        aqi
    ]]

    flood_prediction = int(flood_model.predict(features)[0])
    fire_prediction = int(fire_model.predict(features)[0])

    risk_levels = {
        0: "Low",
        1: "Medium",
        2: "High"
    }

    return jsonify({
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": rainfall,
        "aqi": aqi,
        "floodRisk": risk_levels[flood_prediction],
        "wildfireRisk": risk_levels[fire_prediction]
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "GreenShield ML API is running"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)