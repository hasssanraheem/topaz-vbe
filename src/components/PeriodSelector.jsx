export default function PeriodSelector({ period, onChange }) {
  return (
    <div className="period-bar">
      <label htmlFor="period-select">Period:</label>
      <select id="period-select" value={period} onChange={e => onChange(Number(e.target.value))}>
        <option value={1}>Period 1 — 2024 Q1</option>
        <option value={2}>Period 2 — 2024 Q2</option>
        <option value={3}>Period 3 — 2024 Q3</option>
        <option value={4}>Period 4 — 2024 Q4</option>
      </select>
      <span style={{ fontSize: '0.8em', color: '#800', marginLeft: 8 }}>
        Demonstration data — not official Topaz-VBE data
      </span>
    </div>
  );
}
