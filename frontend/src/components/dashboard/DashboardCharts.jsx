import React, { useState } from "react";

// ── UTILS FOR SMOOTH CUBIC BEZIER SPLINES ──
function getSplinePath(points, width, height, yMax = 100, yMin = 0) {
  if (!points || points.length === 0) return "";
  const range = yMax - yMin || 1;
  const paddingX = 30;
  const paddingY = 20;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const pts = points.map((val, i) => {
    const x = paddingX + (i / Math.max(1, points.length - 1)) * graphWidth;
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const y = height - paddingY - ((clamped - yMin) / range) * graphHeight;
    return { x, y, val };
  });

  if (pts.length === 1) {
    return `M ${pts[0].x} ${pts[0].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// ── 1. DUAL SPLINE LINE CHART (TOOLTIP ONLY VISIBLE ON HOVER) ──
export function SplineLineChart({
  series = [],
  labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  yMax = 100,
  yMin = 0,
  ySteps,
  height = 180,
  width = 500,
  unit = ""
}) {
  // STRICT: Tooltip and hover guides are null/hidden until cursor reaches the chart!
  const [hoverIndex, setHoverIndex] = useState(null);

  const paddingX = 30;
  const paddingY = 20;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;
  const range = yMax - yMin || 1;

  const steps = ySteps || [
    yMin,
    Math.round(yMin + range * 0.25),
    Math.round(yMin + range * 0.5),
    Math.round(yMin + range * 0.75),
    yMax
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relX = (x / rect.width) * width;
    const ratio = Math.max(0, Math.min(1, (relX - paddingX) / graphWidth));
    const idx = Math.round(ratio * (labels.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeX = hoverIndex !== null ? paddingX + (hoverIndex / Math.max(1, labels.length - 1)) * graphWidth : 0;

  return (
    <div
      className="mc-chart-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", cursor: "crosshair" }}
    >
      <svg
        viewBox={`0 0 ${width} ${height + 25}`}
        className="mc-chart-svg"
        preserveAspectRatio="none"
      >
        <defs>
          {series.map((s, i) => (
            <linearGradient key={`grad-${i}`} id={`areaGrad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal Dashed Grid Lines */}
        {steps.map((yVal) => {
          const yPos = height - paddingY - ((yVal - yMin) / range) * graphHeight;
          return (
            <g key={yVal}>
              <line
                x1={paddingX}
                y1={yPos}
                x2={width - paddingX}
                y2={yPos}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="3 3"
              />
              <text
                x={paddingX - 6}
                y={yPos + 3}
                fill="currentColor"
                opacity="0.4"
                fontSize="10"
                textAnchor="end"
              >
                {yVal}
              </text>
            </g>
          );
        })}

        {/* Series Area Fills and Lines */}
        {series.map((s, i) => {
          const lineD = getSplinePath(s.data, width, height, yMax, yMin);
          const areaD = `${lineD} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;
          return (
            <g key={s.name}>
              <path d={areaD} fill={`url(#areaGrad-${i})`} />
              <path
                d={lineD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Active Vertical Guideline and Marker Dots (ONLY SHOWN WHEN HOVERED) */}
        {hoverIndex !== null && labels.length > 0 && (
          <g>
            <line
              x1={activeX}
              y1={paddingY}
              x2={activeX}
              y2={height - paddingY}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {series.map((s) => {
              const val = s.data && s.data[hoverIndex] !== undefined ? s.data[hoverIndex] : 0;
              const yPos = height - paddingY - ((Math.max(yMin, Math.min(yMax, val)) - yMin) / range) * graphHeight;
              return (
                <circle
                  key={s.name}
                  cx={activeX}
                  cy={yPos}
                  r="5"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              );
            })}
          </g>
        )}

        {/* X Axis Labels */}
        {labels.map((lbl, i) => {
          const xPos = paddingX + (i / Math.max(1, labels.length - 1)) * graphWidth;
          const isSelected = hoverIndex === i;
          return (
            <text
              key={lbl + i}
              x={xPos}
              y={height + 15}
              fill="currentColor"
              opacity={isSelected ? "1" : "0.4"}
              fontWeight={isSelected ? "700" : "500"}
              fontSize="11"
              textAnchor="middle"
            >
              {lbl}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip (ONLY SHOWN WHEN HOVERED) */}
      {hoverIndex !== null && labels.length > 0 && (
        <div
          className="mc-chart-tooltip"
          style={{
            left: `${(activeX / width) * 100}%`,
            top: "15%",
            pointerEvents: "none"
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "3px", color: "var(--mc-db-text-primary)" }}>
            {labels[hoverIndex]}
          </div>
          {series.map((s) => {
            const val = s.data && s.data[hoverIndex] !== undefined ? s.data[hoverIndex] : 0;
            return (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "6px", color: s.color }}>
                <span>{s.name.toLowerCase()} : {val}{unit}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 2. CIRCULAR RADIAL WELLNESS SCORE GAUGE ──
export function RadialWellnessGauge({ score = 0, sleep = 0, mood = 0, energy = 0 }) {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 52;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = normalizedScore === 0 ? arcLength : arcLength - (normalizedScore / 100) * arcLength;

  return (
    <div className="mc-radial-gauge-wrap">
      <svg viewBox="0 0 140 100" className="mc-radial-gauge-svg">
        <defs>
          <linearGradient id="scoreTealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        
        {/* Background Track Arc */}
        <path
          d="M 28 85 A 52 52 0 1 1 112 85"
          fill="none"
          stroke="currentColor"
          opacity="0.1"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Active Score Arc */}
        <path
          d="M 28 85 A 52 52 0 1 1 112 85"
          fill="none"
          stroke="url(#scoreTealGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>

      <div className="mc-radial-gauge-info">
        <div className="mc-radial-score-num">{normalizedScore}</div>
        <div className="mc-radial-score-sub">out of 100</div>
      </div>

      <div className="mc-radial-metrics-row">
        <div className="mc-radial-metric-item">
          <div className="mc-radial-metric-val">{sleep}%</div>
          <div className="mc-radial-metric-lbl">Sleep</div>
        </div>
        <div className="mc-radial-metric-item">
          <div className="mc-radial-metric-val">{mood}%</div>
          <div className="mc-radial-metric-lbl">Mood</div>
        </div>
        <div className="mc-radial-metric-item">
          <div className="mc-radial-metric-val">{energy}%</div>
          <div className="mc-radial-metric-lbl">Energy</div>
        </div>
      </div>
    </div>
  );
}

// ── 3. WEEKLY SESSION FREQUENCY BAR CHART ──
export function WeeklySessionBarChart({ data = [0, 0, 0, 0, 0, 0], labels = ["W1", "W2", "W3", "W4", "W5", "W6"] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const maxVal = Math.max(1, ...data);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "120px", padding: "0 0.5rem" }}>
        {data.map((val, i) => {
          const heightPct = val > 0 ? Math.max(12, (val / maxVal) * 100) : 4;
          const isHovered = hoveredIdx === i;
          const isLatest = i === data.length - 1 && val > 0;
          return (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1, position: "relative", cursor: "pointer" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div
                  className="mc-chart-tooltip"
                  style={{
                    position: "absolute",
                    top: "-30px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {labels[i]}: {val} sessions
                </div>
              )}
              <div
                style={{
                  width: "28px",
                  height: `${heightPct}%`,
                  borderRadius: "6px 6px 2px 2px",
                  backgroundColor: isHovered ? "#38bdf8" : isLatest ? "#14b8a6" : val > 0 ? "rgba(20, 184, 166, 0.5)" : "rgba(30, 41, 59, 0.4)",
                  border: isHovered ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.05)",
                  transition: "all 0.2s ease",
                  boxShadow: isHovered || isLatest ? "0 0 12px rgba(20, 184, 166, 0.4)" : "none"
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 0.5rem", borderTop: "1px solid var(--mc-db-border)", paddingTop: "8px" }}>
        {labels.map((lbl, i) => (
          <span key={lbl} style={{ flex: 1, textAlign: "center", fontSize: "0.75rem", color: hoveredIdx === i ? "var(--mc-db-text-primary)" : "var(--mc-db-text-secondary)", fontWeight: hoveredIdx === i ? 700 : 500 }}>
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 4. MONTHLY REVENUE BAR CHART (THERAPIST) ──
export function MonthlyRevenueBarChart({ data = [0, 0, 0, 0, 0, 0], labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"], unit = "$" }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const maxVal = Math.max(1, ...data);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "120px", padding: "0 0.5rem" }}>
        {data.map((val, i) => {
          const heightPct = val > 0 ? Math.max(12, (val / maxVal) * 100) : 4;
          const isHovered = hoveredIdx === i;
          const isCurrent = i === data.length - 1 && val > 0;
          return (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1, position: "relative", cursor: "pointer" }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div
                  className="mc-chart-tooltip"
                  style={{
                    position: "absolute",
                    top: "-30px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {labels[i]}: {unit}{val}
                </div>
              )}
              <div
                style={{
                  width: "28px",
                  height: `${heightPct}%`,
                  borderRadius: "6px 6px 2px 2px",
                  backgroundColor: isHovered ? "#fbbf24" : isCurrent ? "#f59e0b" : val > 0 ? "rgba(245, 158, 11, 0.5)" : "rgba(30, 41, 59, 0.4)",
                  boxShadow: isHovered || isCurrent ? "0 0 12px rgba(245, 158, 11, 0.4)" : "none",
                  transition: "all 0.2s ease"
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 0.5rem", borderTop: "1px solid var(--mc-db-border)", paddingTop: "8px" }}>
        {labels.map((lbl, i) => (
          <span key={lbl} style={{ flex: 1, textAlign: "center", fontSize: "0.75rem", color: hoveredIdx === i ? "var(--mc-db-text-primary)" : "var(--mc-db-text-secondary)", fontWeight: hoveredIdx === i ? 700 : 500 }}>
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 5. MODALITY HORIZONTAL BARS (ADMIN) ──
export function ModalityHorizontalBars({
  data = [
    { name: "CBT", count: 0 },
    { name: "ACT", count: 0 },
    { name: "DBT", count: 0 },
    { name: "CBT-I", count: 0 },
    { name: "Other", count: 0 }
  ]
}) {
  const [hovered, setHovered] = useState(null);
  const maxVal = Math.max(1, ...data.map((d) => d.count || 0));
  const scalePoints = maxVal > 10 ? [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal] : [0, 2, 4, 6, 8, 10];

  return (
    <div className="mc-modality-chart" style={{ position: "relative" }}>
      {data.map((item, idx) => {
        const pct = item.count > 0 ? Math.max(6, (item.count / maxVal) * 100) : 0;
        const isHovered = hovered === idx;
        return (
          <div
            key={item.name}
            className="mc-modality-row"
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
            style={{ position: "relative" }}
          >
            <div className="mc-modality-lbl">{item.name}</div>
            <div className="mc-modality-track" style={{ overflow: "visible" }}>
              {pct > 0 ? (
                <div
                  className={`mc-modality-bar ${isHovered ? "active" : ""}`}
                  style={{ width: `${pct}%`, position: "relative" }}
                >
                  {isHovered && (
                    <div
                      className="mc-chart-tooltip"
                      style={{
                        position: "absolute",
                        right: "0",
                        top: "-8px",
                        transform: "translate(50%, -100%)",
                        pointerEvents: "none",
                        zIndex: 20
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "var(--mc-db-text-primary)" }}>{item.name}</div>
                      <div style={{ color: "#06b6d4" }}>sessions: {item.count}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: "0%", height: "100%" }} />
              )}
            </div>
          </div>
        );
      })}
      
      {/* X Axis scale */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "55px", paddingTop: "6px", fontSize: "0.72rem", color: "var(--mc-db-text-muted)" }}>
        {scalePoints.map((pt, i) => (
          <span key={i}>{pt}</span>
        ))}
      </div>
    </div>
  );
}

