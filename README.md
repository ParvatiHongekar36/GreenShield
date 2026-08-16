# GreenShield 🌱
### Intelligent Disaster Prediction & Environmental Protection System

A full-stack web application that detects a user's location, fetches real-time environmental data, and uses a machine learning model to predict flood and wildfire risk levels.

**Developed by:** Sanjana Karekar, Srushti Undale, Rohini Patil, Parvati Hongekar
**Guide:** Prof. Siddharth B
**Institution:** Jain College of Engineering, Department of Computer Science and Engineering

---

## Features

- Real-time location detection via browser Geolocation API
- Live weather data (temperature, humidity, rainfall) via OpenWeatherMap API
- Air Quality Index (AQI) monitoring
- ML-based disaster risk prediction (Flood & Wildfire) using Random Forest
- Prediction history — every prediction is saved and displayed with timestamp and location
- Clean, responsive dashboard UI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), JavaScript, CSS |
| Backend | Java, Spring Boot, Maven |
| ML Service | Python, Flask, scikit-learn, pandas |
| Database | MySQL |
| External APIs | OpenWeatherMap (weather + air pollution) |

---

## Architecture

React Frontend (port 3001) sends requests to Spring Boot Backend (port 8080), which connects to both MySQL DB and the Flask ML API (port 5000). The Flask API uses Random Forest Models to predict Flood and Wildfire risk.

**Flow:**
1. User clicks "Get My Location" — browser detects GPS coordinates
2. React calls Spring Boot — Spring Boot calls OpenWeatherMap — returns real temperature, humidity, rainfall, and AQI
3. User clicks "Predict Disaster Risk" — React sends weather data to Spring Boot
4. Spring Boot forwards data to the Flask ML API — Random Forest models return risk levels (Low/Medium/High)
5. Spring Boot saves the full prediction (location, weather, risk levels, timestamp) to MySQL
6. React displays the result and refreshes the prediction history

---

## Machine Learning Model

- **Algorithm:** Random Forest Classifier (scikit-learn)
- **Dataset:** 500 synthetically generated samples based on explainable environmental rules (rainfall/humidity relates to flood risk; temperature/humidity/AQI relates to wildfire risk)
- **Train/test split:** 80/20
- **Accuracy:**
  - Flood model: 84%
  - Wildfire model: 79%

**Note:** The dataset is synthetically generated for this academic project due to the lack of large, labeled, publicly available disaster datasets. It follows realistic environmental logic but is not derived from real historical disaster records. This is a documented limitation — see below.

---

## Setup & Installation

### Prerequisites
- Node.js & npm
- Java 17+ & Maven
- Python 3.x
- MySQL Server 8.0

### 1. Machine Learning Service
Navigate to the ml-model folder, run train_model.py to train and save the models, then run app.py to start the Flask API on port 5000.

### 2. Backend (Spring Boot)
Update backend/src/main/resources/application.properties with your own MySQL password and OpenWeatherMap API key. Then navigate to the backend folder and run it with Maven to start on port 8080.

### 3. Frontend (React)
Navigate to the frontend folder, install dependencies with npm, then run the dev server to start on port 3001.

### 4. Database
Create a database named greenshield_db in MySQL. Tables are auto-created by Spring Boot (Hibernate ddl-auto=update) on first run.

---

## Known Limitations

- ML models are trained on a synthetic (not real historical) dataset — appropriate for demonstrating the ML pipeline, not for real-world deployment
- AQI values from OpenWeatherMap's free tier are limited to a 1–5 category scale and are converted to approximate real-world AQI figures
- Currently supports Flood and Wildfire prediction only
- Runs locally; not yet deployed to a public server

---

## Future Scope

- Earthquake and Landslide risk prediction
- Interactive map with risk visualization (GIS)
- Charts for historical environmental trends
- Larger, real-world disaster dataset
- Cloud deployment
- Mobile app / push notifications for alerts

---

## License

This project was developed as a final-year Major Project for academic purposes.