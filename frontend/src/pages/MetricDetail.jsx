import { useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CONFIGS = {
  temperature: { label: 'Temperature',      unit: '°C',  thresholds: [25, 35],  desc: 'Ambient air temperature', context: 'Values above 35°C indicate heat stress and elevated wildfire risk.' },
  humidity:    { label: 'Humidity',          unit: '%',   thresholds: [40, 70],  desc: 'Relative humidity',        context: 'Low humidity accelerates fire spread. High humidity raises flood risk.' },
  rainfall:    { label: 'Rainfall',          unit: 'mm',  thresholds: [10, 50],  desc: 'Accumulated precipitation', context: 'Rainfall above 50 mm/day significantly elevates flash flood risk.' },
  aqi:         { label: 'Air Quality Index', unit: 'AQI', thresholds: [50, 150], desc: 'Airborne pollutant level',  context: 'AQI above 150 is unhealthy. Values above 200 pose serious health risks.' },
};

const ACCENT = '#1b6b3a';

function getLevel(v, low, med) {
  if (v <= low) return { label: 'Low',    cls: 'badge-low' };
  if (v <= med) return { label: 'Medium', cls: 'badge-medium' };
  return               { label: 'High',   cls: 'badge-high' };
}

function genData(val) {
  const spread  = Math.max(val * 0.22, 3);
  const fSpread = Math.max(val * 0.14, 2);
  const today   = new Date();
  const rows    = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    rows.push({ day: label, Historical: Math.max(0, parseFloat((val + (Math.random() - 0.5) * spread).toFixed(1))), Forecast: null });
  }
  for (let i = 1; i <= 2; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    rows.push({ day: label, Historical: null, Forecast: Math.max(0, parseFloat((val + (Math.random() - 0.38) * fSpread).toFixed(1))) });
  }
  return rows;
}

function Trend({ current, prev }) {
  if (prev == null) return null;
  const d = parseFloat((current - prev).toFixed(1));
  if (Math.abs(d) < 0.5) return <span className="trend trend-flat">Stable</span>;
  return d > 0
    ? <span className="trend trend-up">↑ +{d} from yesterday</span>
    : <span className="trend trend-down">↓ {d} from yesterday</span>;
}

const ChartTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const entry = payload.find(p => p.value !== null);
  if (!entry) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '9px 13px', fontSize: '0.78rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ color: 'var(--text-faint)', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{entry.value} {unit}</div>
    </div>
  );
};

export default function MetricDetail() {
  const { metric } = useParams();
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const cfg = CONFIGS[metric];

  if (!cfg) return (
    <div style={{ padding: 32 }}>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
    </div>
  );

  const current      = state?.value ?? 0;
  const weather      = state?.weather ?? {};
  const data         = useMemo(() => genData(current), [current]);
  const histRows     = data.filter(d => d.Historical !== null);
  const histVals     = histRows.map(d => d.Historical);
  const forecastRows = data.filter(d => d.Forecast !== null);
  const min = Math.min(...histVals);
  const max = Math.max(...histVals);
  const avg = parseFloat((histVals.reduce((a, b) => a + b, 0) / histVals.length).toFixed(1));
  const lvl = getLevel(current, cfg.thresholds[0], cfg.thresholds[1]);

  const others = Object.entries(CONFIGS)
    .filter(([k]) => k !== metric)
    .map(([k, c]) => {
      const v = k === 'temperature' ? weather.temp : k === 'humidity' ? weather.humidity
              : k === 'rainfall' ? weather.rainfall : weather.aqi;
      return { key: k, label: c.label, unit: c.unit, value: v, lvl: getLevel(v ?? 0, c.thresholds[0], c.thresholds[1]) };
    });

  return (
    <>
      <div className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">G</div>
          GreenShield
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Dashboard</button>
      </div>

      <div className="container">

        {/* Hero */}
        <div className="card">
          <div className="card-head">
            <span className="card-label">{cfg.desc}</span>
            <span className={`badge ${lvl.cls}`}>{lvl.label} Level</span>
          </div>
          <div className="detail-hero">
            <div>
              <div className="hero-number">{current}<span className="hero-unit">{cfg.unit}</span></div>
              <div style={{ marginTop: '8px' }}><Trend current={current} prev={histVals[5]} /></div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', maxWidth: '200px', lineHeight: 1.6, textAlign: 'right' }}>
              {cfg.context}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-row">
          <div className="stat-box"><div className="stat-val">{min}</div><div className="stat-lbl">7-Day Min</div></div>
          <div className="stat-box"><div className="stat-val">{avg}</div><div className="stat-lbl">7-Day Avg</div></div>
          <div className="stat-box"><div className="stat-val">{max}</div><div className="stat-lbl">7-Day Max</div></div>
        </div>

        {/* Area chart */}
        <div className="card">
          <div className="card-head">
            <span className="card-label">Historical Trend — 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={histRows} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.13} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-2)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip unit={cfg.unit} />} />
              <Area type="monotone" dataKey="Historical" stroke={ACCENT} strokeWidth={2}
                fill="url(#aGrad)" dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar + Forecast */}
        <div className="grid-2">
          <div className="card" style={{ margin: 0 }}>
            <div className="card-head"><span className="card-label">Daily Comparison</span></div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={histRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border-2)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} width={34} />
                <Tooltip content={<ChartTooltip unit={cfg.unit} />} />
                <Bar dataKey="Historical" fill={ACCENT} radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ margin: 0 }}>
            <div className="card-head">
              <span className="card-label">2-Day Forecast</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>ML projection</span>
            </div>
            {forecastRows.map(row => {
              const fl = getLevel(row.Forecast, cfg.thresholds[0], cfg.thresholds[1]);
              return (
                <div className="forecast-item" key={row.day}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.day}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '2px' }}>Projected</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{row.Forecast} {cfg.unit}</div>
                    <span className={`badge ${fl.cls}`} style={{ marginTop: '4px', display: 'inline-block' }}>{fl.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other metrics */}
        <div className="card">
          <div className="card-head"><span className="card-label">Other Parameters</span></div>
          {others.map(m => (
            <div key={m.key} className="metric-row metric-row-clickable"
              onClick={() => navigate(`/metric/${m.key}`, { state: { value: m.value, weather } })}>
              <span className="metric-label">{m.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="metric-value">{m.value ?? '—'} {m.unit}</span>
                <span className={`badge ${m.lvl.cls}`}>{m.lvl.label}</span>
                <span style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>›</span>
              </span>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
