export type DonutSegment = { name: string; value: number; color: string };

export default function DonutChart({
  data,
  size = 150,
  thickness = 24,
  centerLabel,
  centerSub,
}: {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2630" strokeWidth={thickness} />
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            >
              <title>{`${d.name} · ${Math.round((d.value / total) * 100)}%`}</title>
            </circle>
          );
          offset += len;
          return seg;
        })}
      </g>
      {centerLabel && (
        <text x={size / 2} y={size / 2 - (centerSub ? 6 : 0)} textAnchor="middle" dominantBaseline="central"
          fontSize="20" fontWeight="800" fill="#e6edf3">
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" dominantBaseline="central"
          fontSize="11" fill="#8b949e">
          {centerSub}
        </text>
      )}
    </svg>
  );
}
