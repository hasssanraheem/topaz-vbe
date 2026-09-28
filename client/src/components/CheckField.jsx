export default function CheckField({ label, checked, onChange, disabled, note }) {
  return (
    <div className="field-row" style={{ alignItems: 'center' }}>
      <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <input
          type="checkbox"
          className="field-check"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
        />
        {label}
      </label>
      {note && <span className="field-unit" style={{ marginLeft: 8 }}>{note}</span>}
    </div>
  );
}
