function fmtGBP(v) {
  if (v === null || v === undefined) return '—';
  const n = Number(v);
  if (isNaN(n)) return v;
  const abs = Math.abs(n);
  return (n < 0 ? '(£' : '£') + abs.toLocaleString('en-GB') + (n < 0 ? ')' : '');
}

export default function ReadOnlyTable({ caption, rows }) {
  return (
    <table className="readonly-table">
      {caption && <caption style={{ textAlign: 'left', fontWeight: 'bold', padding: '2px 0 4px', color: '#036' }}>{caption}</caption>}
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={row.total ? 'total-row' : ''}>
            <td>{row.label}</td>
            <td>{fmtGBP(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
