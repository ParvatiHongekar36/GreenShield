import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = 'http://localhost:8080';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 10); }, [lat, lng, map]);
  return null;
}

function getLevel(v, low, med) { return v <= low ? 'Low' : v <= med ? 'Medium' : 'High'; }
function badgeClass(l) { return ({ low: 'badge-low', medium: 'badge-medium', high: 'badge-high' })[(l||'').toLowerCase()] || ''; }
function levelClass(l) { return ({ low: 'level-low', medium: 'level-medium', high: 'level-high' })[(l||'').toLowerCase()] || 'level-waiting'; }
function computeScore(f, w, e, c) {
  const s = l => l === 'High' ? 3 : l === 'Medium' ? 2 : l === 'Low' ? 1 : 0;
  return Math.round(((s(f) + s(w) + s(e) + s(c)) / 12) * 100);
}

// Request browser push notification permission
async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// Fetch elevation from Open-Elevation API
async function fetchElevation(lat, lng) {
  try {
    const r = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
    const d = await r.json();
    return d?.results?.[0]?.elevation ?? null;
  } catch (e) {
    return null;
  }
}

// Fetch nearby hospitals/safe zones from Overpass API
async function fetchSafeZones(lat, lng) {
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:10000,${lat},${lng});
      node["amenity"="fire_station"](around:10000,${lat},${lng});
      node["amenity"="police"](around:10000,${lat},${lng});
    );
    out 8;
  `;
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });
    const d = await r.json();
    return (d.elements || []).map(el => ({
      id: el.id,
      lat: el.lat,
      lng: el.lon,
      name: el.tags?.name || el.tags?.amenity || 'Safe Zone',
      type: el.tags?.amenity,
    }));
  } catch (e) {
    return [];
  }
}

const safeZoneIcon = (type) => {
  const color = type === 'hospital' ? '#dc2626' : type === 'fire_station' ? '#d97706' : '#1b6b3a';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="${color}"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">${type === 'hospital' ? 'H' : type === 'fire_station' ? 'F' : 'P'}</text></svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
};

function ConfidencePill({ value }) {
  if (value == null) return null;
  return (
    <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)', marginLeft: '4px' }}>
      {value}%
    </span>
  );
}

// Seismic zones by state (approximate, based on the IS 1893 India seismic zone map)
const SEISMIC_ZONES = {
  'jammu and kashmir': 'V', 'ladakh': 'V', 'himachal pradesh': 'IV', 'uttarakhand': 'IV',
  'delhi': 'IV', 'bihar': 'IV', 'assam': 'V', 'manipur': 'V', 'nagaland': 'V',
  'mizoram': 'V', 'arunachal pradesh': 'V', 'meghalaya': 'V', 'tripura': 'V',
  'sikkim': 'IV', 'gujarat': 'IV', 'maharashtra': 'III', 'karnataka': 'II',
  'kerala': 'III', 'tamil nadu': 'III', 'andhra pradesh': 'III', 'telangana': 'II',
  'rajasthan': 'II', 'madhya pradesh': 'II', 'uttar pradesh': 'III',
  'west bengal': 'III', 'odisha': 'III', 'goa': 'III',
};

function getEarthquakeRisk(state) {
  const zone = SEISMIC_ZONES[(state || '').trim().toLowerCase()] || 'III';
  const riskLevel = zone === 'V' || zone === 'IV' ? 'High' : zone === 'III' ? 'Medium' : 'Low';
  return { riskLevel, seismicZone: zone };
}

export default function App() {
  const navigate = useNavigate();
  const prevRisksRef = useRef({});
  const [dark, setDark] = useState(() => localStorage.getItem('gs_dark') === 'true');
  const [location, setLocation]     = useState(null);
  const [placeName, setPlaceName]   = useState('');
  const [stateName, setStateName]   = useState('');
  const [manualCity, setManualCity] = useState('');
  const [loading, setLoading]             = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [predLoading, setPredLoading]     = useState(false);
  const [lastUpdated, setLastUpdated]     = useState(null);
  const [elevation, setElevation]         = useState(null);
  const [safeZones, setSafeZones]         = useState([]);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [weather, setWeather] = useState({ temp: 28, humidity: 65, rainfall: 12, aqi: 42, windSpeed: 20 });
  const [risks, setRisks]     = useState({ flood: 'Waiting...', floodConf: null, wildfire: 'Waiting...', wildfireConf: null, cyclone: 'Waiting...', cycloneConf: null });
  const [eqRisk, setEqRisk]   = useState({ riskLevel: 'Waiting...', seismicZone: '' });
  const [floodZone, setFloodZone] = useState(null);

  useEffect(() => {
    document.body.className = dark ? 'dark' : '';
    localStorage.setItem('gs_dark', dark);
  }, [dark]);

  useEffect(() => { getLocation(); requestNotifPermission(); }, []);

  // Watch for new High risks and send notifications
  useEffect(() => {
    const allRisks = {
      'Flood': risks.flood,
      'Wildfire': risks.wildfire,
      'Cyclone': risks.cyclone,
      'Earthquake': eqRisk.riskLevel,
    };
    Object.entries(allRisks).forEach(([name, level]) => {
      if (level === 'High' && prevRisksRef.current[name] !== 'High') {
        sendNotification(`⚠️ ${name} Risk Alert`, `${name} risk is now HIGH for ${placeName || 'your area'}. Take precautions immediately.`);
      }
    });
    prevRisksRef.current = allRisks;
  }, [risks, eqRisk, placeName]);

  const getLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setLocation({ lat, lng });
        try {
          const g = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const d = await g.json();
          const a = d.address || {};
          const name = a.city || a.town || a.village || a.county || 'Unknown';
          const st = a.state || '';
          setPlaceName(st ? `${name}, ${st}` : name);
          setStateName(st);
        } catch (e) { console.error(e); }
        // Fetch elevation for flood zone detection
        const elev = await fetchElevation(lat, lng);
        setElevation(elev);
        try {
          const r = await fetch(`${API}/api/weather?lat=${lat}&lon=${lng}`);
          if (!r.ok) throw new Error();
          const d = await r.json();
          setWeather(prev => ({ ...prev, temp: d.temperature, humidity: d.humidity, rainfall: d.rainfall, aqi: d.aqi, windSpeed: d.windSpeed ?? prev.windSpeed }));
          setLastUpdated(new Date());
        } catch (e) {
          console.error('Weather fetch failed:', e);
          setErrorMsg("Couldn't reach the weather service — showing default values. Check that the backend is running.");
        }
        finally { setLoading(false); }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) alert('Location permission denied.\n\nFix: click the lock icon in the address bar → set Location to Allow → refresh.');
        else if (err.code === 2) alert('Location unavailable. Please search by city name.');
        else alert('Location timed out. Try again or search manually.');
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const searchByCity = async () => {
    if (!manualCity.trim()) return;
    setSearchLoading(true);
    try {
      const g = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualCity + ', India')}&limit=1`);
      const res = await g.json();
      if (!res?.length) { alert('City not found'); setSearchLoading(false); return; }
      const lat = parseFloat(res[0].lat), lng = parseFloat(res[0].lon);
      setLocation({ lat, lng }); setPlaceName(manualCity);
      try {
        const rv = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const rd = await rv.json();
        setStateName(rd.address?.state || '');
      } catch (e) { setStateName(''); }
      const elev = await fetchElevation(lat, lng);
      setElevation(elev);
      const r = await fetch(`${API}/api/weather?lat=${lat}&lon=${lng}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setWeather(prev => ({ ...prev, temp: d.temperature, humidity: d.humidity, rainfall: d.rainfall, aqi: d.aqi, windSpeed: d.windSpeed ?? prev.windSpeed }));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Search weather fetch failed:', e);
      setErrorMsg("Couldn't reach the weather service for that city. Check that the backend is running.");
    }
    finally { setSearchLoading(false); }
  };

  const predict = async () => {
    setPredLoading(true);
    setErrorMsg(null);
    try {
      const r = await fetch(`${API}/api/prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: weather.temp,
          humidity: weather.humidity,
          rainfall: weather.rainfall,
          aqi: weather.aqi,
          windSpeed: weather.windSpeed,
          elevation: elevation,
          lat: location?.lat ?? 0,
          lon: location?.lng ?? 0,
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        console.error('Prediction HTTP error', r.status, text);
        throw new Error(`Server returned ${r.status}`);
      }
      const d = await r.json();

      setWeather(prev => ({
        ...prev,
        temp: d.temperature ?? prev.temp,
        humidity: d.humidity ?? prev.humidity,
        rainfall: d.rainfall ?? prev.rainfall,
        aqi: d.aqi ?? prev.aqi,
        windSpeed: d.windSpeed ?? prev.windSpeed,
      }));
      setRisks({
        flood: d.floodRisk ?? 'Waiting...',
        floodConf: d.floodConfidence ?? null,
        wildfire: d.wildfireRisk ?? 'Waiting...',
        wildfireConf: d.wildfireConfidence ?? null,
        cyclone: d.cycloneRisk ?? 'Waiting...',
        cycloneConf: d.cycloneConfidence ?? null,
      });
      setFloodZone(d.floodZone ?? null);

      // Save this user's location so the daily alert can use it
      try {
        const savedUser = JSON.parse(localStorage.getItem('greenshieldUser') || 'null');
        if (savedUser && location) {
          fetch(`${API}/api/users/${savedUser.id}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: location.lat, lon: location.lng, place: placeName || stateName || '' }),
          }).catch(() => {});
        }
      } catch (e) { /* ignore */ }

      setEqRisk(getEarthquakeRisk(stateName));

      // Load safe zones if any risk is High
      if ([d.floodRisk, d.wildfireRisk, d.cycloneRisk].includes('High') && location) {
        const zones = await fetchSafeZones(location.lat, location.lng);
        setSafeZones(zones);
        setShowSafeZones(true);
      }
    } catch (e) {
      console.error('Prediction failed:', e);
      setErrorMsg(
        e.message.startsWith('Server returned')
          ? `Risk assessment failed (${e.message}). Check the Spring Boot terminal for the error.`
          : "Can't reach the backend on port 8080. Make sure Spring Boot (mvn spring-boot:run) is running."
      );
    } finally {
      setPredLoading(false);
    }
  };

  const markerColor = () => {
    const r = [risks.flood, risks.wildfire, risks.cyclone];
    return r.includes('High') ? 'red' : r.includes('Medium') ? 'orange' : r.includes('Low') ? 'green' : 'blue';
  };
  const makeIcon = c => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${c}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  });

  const tL = getLevel(weather.temp, 25, 35);
  const hL = getLevel(weather.humidity, 40, 70);
  const rL = getLevel(weather.rainfall, 10, 50);
  const aL = getLevel(weather.aqi, 50, 150);
  const score   = computeScore(risks.flood, risks.wildfire, eqRisk.riskLevel, risks.cyclone);
  const anyHigh = [risks.flood, risks.wildfire, eqRisk.riskLevel, risks.cyclone].includes('High');
  const scoreColor = score >= 67 ? '#c0392b' : score >= 34 ? '#d97706' : '#1b6b3a';
  const scoreCls   = score >= 67 ? 'status-crit' : score >= 34 ? 'status-mod' : 'status-safe';
  const scoreTxt   = score >= 67 ? 'Critical' : score >= 34 ? 'Moderate' : 'Safe';

  const floodZoneColor = { 'Zone A': '#dc2626', 'Zone B': '#d97706', 'Zone C': '#1b6b3a' };

  const metrics = [
    { key: 'temperature', label: 'Temperature',      value: weather.temp,      unit: '°C',  level: tL },
    { key: 'humidity',    label: 'Humidity',          value: weather.humidity,  unit: '%',   level: hL },
    { key: 'rainfall',    label: 'Rainfall',          value: weather.rainfall,  unit: 'mm',  level: rL },
    { key: 'aqi',         label: 'Air Quality Index', value: weather.aqi,       unit: 'AQI', level: aL },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">G</div>
          GreenShield
        </div>
        <div className="topbar-right">
          {lastUpdated && (
            <div className="status-pill">
              <div className="status-dot" />
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          {placeName && <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{placeName}</span>}
          <button className="theme-btn" onClick={() => setDark(d => !d)}>
            {dark ? 'Light' : 'Dark'}
          </button>
          <button className="theme-btn" onClick={() => { localStorage.removeItem('greenshieldUser'); navigate('/login'); }}>
            Log out
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner">
          <div className="alert-dot" style={{ background: '#d97706' }} />
          {errorMsg}
          <button className="error-banner-close" onClick={() => setErrorMsg(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {anyHigh && (
        <div className="alert-banner">
          <div className="alert-dot" />
          High-level disaster risk detected for {placeName || 'selected area'} — immediate attention recommended
          {showSafeZones && safeZones.length > 0 && (
            <span style={{ marginLeft: '12px', fontWeight: 700 }}>
              · {safeZones.length} safe zones marked on map
            </span>
          )}
        </div>
      )}

      <div className="container">

        {/* Location */}
        <div className="card">
          <div className="card-head">
            <span className="card-label">Location</span>
            <button className="btn btn-ghost btn-sm" onClick={getLocation} disabled={loading}>
              {loading ? 'Detecting...' : 'Use GPS'}
            </button>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
            {placeName || (location ? 'Detecting area...' : 'No location selected')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: elevation != null ? '4px' : '14px' }}>
            {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Coordinates unavailable'}
          </div>
          {elevation != null && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginBottom: '14px' }}>
              Elevation: {elevation} m · {elevation <= 10 ? 'Low-lying area — flood prone' : elevation <= 50 ? 'Moderate elevation' : 'Elevated terrain'}
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ flex: 1, minWidth: '160px' }}
              type="text"
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchByCity()}
              placeholder="Search city or area..."
            />
            <button className="btn btn-primary" onClick={searchByCity} disabled={searchLoading}>
              {searchLoading ? '...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Map */}
        {location && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-head" style={{ padding: '14px 18px 12px' }}>
              <span className="card-label">Location Map</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {placeName && <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>{placeName}</span>}
                {safeZones.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowSafeZones(s => !s)}>
                    {showSafeZones ? 'Hide' : 'Show'} Safe Zones
                  </button>
                )}
              </div>
            </div>
            <MapContainer center={[location.lat, location.lng]} zoom={10} style={{ height: '300px', width: '100%' }}>
              <RecenterMap lat={location.lat} lng={location.lng} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <Marker position={[location.lat, location.lng]} icon={makeIcon(markerColor())}>
                <Popup>
                  {placeName && <><strong>{placeName}</strong><br /></>}
                  {elevation != null && <>Elevation: {elevation}m<br /></>}
                  Flood: {risks.flood}{risks.floodConf ? ` (${risks.floodConf}%)` : ''}<br />
                  Wildfire: {risks.wildfire}{risks.wildfireConf ? ` (${risks.wildfireConf}%)` : ''}<br />
                  Cyclone: {risks.cyclone}{risks.cycloneConf ? ` (${risks.cycloneConf}%)` : ''}<br />
                  Earthquake: {eqRisk.riskLevel}
                  {floodZone && <><br />Flood Zone: {floodZone}</>}
                </Popup>
              </Marker>
              {/* Flood zone radius indicator */}
              {floodZone === 'Zone A' && (
                <Circle center={[location.lat, location.lng]} radius={3000}
                  pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.08, weight: 1.5 }} />
              )}
              {floodZone === 'Zone B' && (
                <Circle center={[location.lat, location.lng]} radius={3000}
                  pathOptions={{ color: '#d97706', fillColor: '#d97706', fillOpacity: 0.06, weight: 1.5 }} />
              )}
              {/* Safe zone markers */}
              {showSafeZones && safeZones.map(z => (
                <Marker key={z.id} position={[z.lat, z.lng]} icon={safeZoneIcon(z.type)}>
                  <Popup><strong>{z.name}</strong><br />{z.type}</Popup>
                </Marker>
              ))}
            </MapContainer>
            {floodZone && (
              <div style={{ padding: '8px 18px', fontSize: '0.75rem', borderTop: '1px solid var(--border-2)', color: floodZoneColor[floodZone] || 'var(--text-faint)', fontWeight: 600 }}>
                Flood Zone: {floodZone} · {floodZone === 'Zone A' ? 'High risk — evacuation may be required' : floodZone === 'Zone B' ? 'Moderate risk — stay alert' : 'Low risk'}
              </div>
            )}
          </div>
        )}

        {/* Environmental monitoring */}
        <div className="card">
          <div className="card-head">
            <span className="card-label">Environmental Monitoring</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Select row for analysis</span>
          </div>
          {metrics.map(m => (
            <div key={m.key} className="metric-row metric-row-clickable"
              onClick={() => navigate(`/metric/${m.key}`, { state: { value: m.value, weather } })}>
              <span className="metric-label">{m.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="metric-value">{m.value} {m.unit}</span>
                <span className={`badge ${badgeClass(m.level)}`}>{m.level}</span>
                <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>›</span>
              </span>
            </div>
          ))}
          {weather.windSpeed != null && (
            <div className="metric-row">
              <span className="metric-label">Wind Speed</span>
              <span className="metric-value">{weather.windSpeed} km/h</span>
            </div>
          )}
        </div>

        {/* Risk assessment */}
        <div className="card">
          <div className="card-head">
            <span className="card-label">Disaster Risk Assessment</span>
            {floodZone && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: floodZoneColor[floodZone] }}>
                Flood {floodZone}
              </span>
            )}
          </div>

          <div className="risk-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[
              { label: 'Flood Risk',      level: risks.flood,      conf: risks.floodConf,    zone: '' },
              { label: 'Wildfire Risk',   level: risks.wildfire,   conf: risks.wildfireConf, zone: '' },
              { label: 'Cyclone Risk',    level: risks.cyclone,    conf: risks.cycloneConf,  zone: '' },
              { label: 'Earthquake Risk', level: eqRisk.riskLevel, conf: null,               zone: eqRisk.seismicZone },
            ].map(r => (
              <div key={r.label} className={`risk-tile ${levelClass(r.level)}`}>
                <div className="risk-tile-label">{r.label}{r.zone ? ` · Zone ${r.zone}` : ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="risk-tile-value">{r.level}</div>
                  {r.conf != null && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>{r.conf}% confidence</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {score > 0 && (
            <div className="score-wrap">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div>
                  <div className="score-number">{score}<span style={{ fontSize: '1rem', color: 'var(--text-faint)', fontWeight: 400 }}>/100</span></div>
                  <span className={`score-status ${scoreCls}`}>{scoreTxt}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', textAlign: 'right', lineHeight: 1.6 }}>
                  Combined risk<br />index
                </div>
              </div>
              <div className="score-bar-bg">
                <div className="score-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
              </div>
              <div className="score-labels"><span>Safe</span><span>Moderate</span><span>Critical</span></div>
            </div>
          )}

          <button className="btn btn-primary btn-full" style={{ marginTop: '14px' }} onClick={predict} disabled={predLoading}>
            {predLoading ? 'Analysing...' : 'Run Disaster Risk Assessment'}
          </button>

          {anyHigh && safeZones.length > 0 && showSafeZones && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Nearby Safe Zones
              </div>
              {safeZones.slice(0, 4).map(z => (
                <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '4px 0', borderBottom: '1px solid var(--border-2)' }}>
                  <span style={{ fontWeight: 600 }}>{z.name}</span>
                  <span style={{ color: 'var(--text-faint)', textTransform: 'capitalize' }}>{z.type?.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}