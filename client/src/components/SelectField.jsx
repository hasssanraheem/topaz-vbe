export default function SelectField({ label, value, onChange, options, error, disabled }) {
  return (
    <div>
      <div className="field-row">
        <label className="field-label">{label}</label>
        <select
          className="field-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
