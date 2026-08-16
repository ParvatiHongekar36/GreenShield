import React, { useState, useEffect } from 'react';

function App() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);

  const [weather, setWeather] = useState({
    temp: 28,
    humidity: 65,
    rainfall: 12,
    aqi: 42,
  });

  const [riskLevels, setRiskLevels] = useState({
    flood: 'Waiting...',
    wildfire: 'Waiting...',
  });

  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/history');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLocation({ lat, lng });

        try {
          const response = await fetch(
            `http://localhost:8080/api/weather?lat=${lat}&lon=${lng}`
          );

          if (!response.ok) {
            throw new Error('Weather request failed');
          }

          const data = await response.json();

          setWeather({
            temp: data.temperature,
            humidity: data.humidity,
            rainfall: data.rainfall,
            aqi: data.aqi,
          });

        } catch (error) {
          console.error(error);
          alert('Unable to fetch real weather data. Using previous values.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        alert('Unable to retrieve location');
        setLoading(false);
      }
    );
  };

  const getPrediction = async () => {
    setPredictionLoading(true);

    try {
      const response = await fetch(
        'http://localhost:8080/api/prediction',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            temperature: weather.temp,
            humidity: weather.humidity,
            rainfall: weather.rainfall,
            aqi: weather.aqi,
            lat: location ? location.lat : 0,
            lon: location ? location.lng : 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Prediction request failed');
      }

      const data = await response.json();

      setWeather({
        temp: data.temperature,
        humidity: data.humidity,
        rainfall: data.rainfall,
        aqi: data.aqi,
      });

      setRiskLevels({
        flood: data.floodRisk,
        wildfire: data.wildfireRisk,
      });

      fetchHistory();

    } catch (error) {
      console.error(error);
      alert('Unable to get disaster prediction');
    } finally {
      setPredictionLoading(false);
    }
  };

  const getBadgeClass = (level) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'badge-low';
      case 'medium':
        return 'badge-medium';
      case 'high':
        return 'badge-high';
      default:
        return '';
    }
  };

  return (
    <div className="container">

      <div className="header">
        <h1>GreenShield</h1>
        <p>
          Intelligent Disaster Prediction & Environmental Protection System
        </p>
      </div>

      <div className="card">
        <h2>Location & Detection</h2>

        <div className="metric-row">
          <span>Coordinates</span>

          <span>
            {location
              ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
              : 'Not detected'}
          </span>
        </div>

        <br />

        <button
          className="btn-primary"
          onClick={getLocation}
          disabled={loading}
        >
          {loading ? 'Detecting Location...' : 'Get My Location'}
        </button>
      </div>

      <div className="card">
        <h2>Environmental Monitoring</h2>

        <div className="metric-row">
          <span>Temperature</span>
          <span>{weather.temp} °C</span>
        </div>

        <div className="metric-row">
          <span>Humidity</span>
          <span>{weather.humidity} %</span>
        </div>

        <div className="metric-row">
          <span>Rainfall</span>
          <span>{weather.rainfall} mm</span>
        </div>

        <div className="metric-row">
          <span>Air Quality Index</span>
          <span>{weather.aqi} AQI</span>
        </div>
      </div>

      <div className="card">
        <h2>Disaster Risk Detection</h2>

        <div className="metric-row">
          <span>Flood Risk</span>
          <span className={getBadgeClass(riskLevels.flood)}>
            {riskLevels.flood}
          </span>
        </div>

        <div className="metric-row">
          <span>Wildfire Risk</span>
          <span className={getBadgeClass(riskLevels.wildfire)}>
            {riskLevels.wildfire}
          </span>
        </div>

        <br />

        <button
          className="btn-primary"
          onClick={getPrediction}
          disabled={predictionLoading}
        >
          {predictionLoading
            ? 'Predicting...'
            : 'Predict Disaster Risk'}
        </button>
      </div>

      <div className="card">
        <h2>Prediction History</h2>

        {history.length === 0 ? (
          <p>No predictions yet.</p>
        ) : (
          history.map((item) => (
            <div className="metric-row" key={item.id}>
              <span>
                {new Date(item.createdAt).toLocaleString()}
              </span>
              <span>
                {item.temperature}°C, {item.humidity}%, {item.rainfall}mm, AQI {item.aqi}
              </span>
              <span className={getBadgeClass(item.floodRisk)}>
                Flood: {item.floodRisk}
              </span>
              <span className={getBadgeClass(item.wildfireRisk)}>
                Fire: {item.wildfireRisk}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default App;