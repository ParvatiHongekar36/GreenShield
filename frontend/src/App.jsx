import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 8);
  }, [lat, lng, map]);
  return null;
}

function App() {
  const [location, setLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
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
    getLocation();
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
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const geoData = await geoResponse.json();
          const address = geoData.address || {};
          const readableName =
            address.city || address.town || address.village ||
            address.county || 'Unknown area';
          const state = address.state || '';
          setPlaceName(state ? `${readableName}, ${state}` : readableName);
        } catch (error) {
          console.error('Reverse geocoding failed', error);
          setPlaceName('');
        }

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

  const searchByCity = async () => {
    if (!manualCity.trim()) {
      alert('Please enter a city name');
      return;
    }

    setSearchLoading(true);

    try {
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualCity + ', India')}&limit=1`
      );
      const geoResults = await geoResponse.json();

      if (!geoResults || geoResults.length === 0) {
        alert('City not found. Try a different name.');
        setSearchLoading(false);
        return;
      }

      const lat = parseFloat(geoResults[0].lat);
      const lng = parseFloat(geoResults[0].lon);

      setLocation({ lat, lng });
      setPlaceName(manualCity);

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
      alert('Unable to fetch data for this city');
    } finally {
      setSearchLoading(false);
    }
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

  const getMarkerColor = () => {
    const highest = [riskLevels.flood, riskLevels.wildfire];
    if (highest.includes('High')) return 'red';
    if (highest.includes('Medium')) return 'orange';
    if (highest.includes('Low')) return 'green';
    return 'blue';
  };

  const createColoredIcon = (color) => {
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
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
          <span>Location</span>

          <span>
            {placeName || (location ? 'Locating area...' : 'Not detected')}
          </span>
        </div>

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

        <br /><br />

        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
          Location wrong? Search manually:
        </p>

        <input
          type="text"
          value={manualCity}
          onChange={(e) => setManualCity(e.target.value)}
         placeholder="Enter area, city (e.g. Machhe, Belagavi)"
          style={{
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            width: '60%',
            marginRight: '8px',
          }}
        />

        <button
          className="btn-primary"
          onClick={searchByCity}
          disabled={searchLoading}
        >
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {location && (
        <div className="card">
          <h2>Location Map</h2>
          {placeName && (
            <p style={{ fontWeight: '600', marginBottom: '8px', color: '#15803d' }}>
              📍 {placeName}
            </p>
          )}
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={8}
            style={{ height: '300px', width: '100%', borderRadius: '8px' }}
          >
            <RecenterMap lat={location.lat} lng={location.lng} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker
              position={[location.lat, location.lng]}
              icon={createColoredIcon(getMarkerColor())}
            >
              <Popup>
                {placeName && <><strong>{placeName}</strong><br /></>}
                Flood Risk: {riskLevels.flood}<br />
                Wildfire Risk: {riskLevels.wildfire}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

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