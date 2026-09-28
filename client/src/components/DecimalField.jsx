export default function DecimalField({ label, value, onChange, error, unit, disabled, min, step = 0.01 }) {
  return (
    <div>
      <div className="field-row">
        <label className="field-label">{label}</label>
        <input
          type="number"
          className="field-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          min={min}
          step={step}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
