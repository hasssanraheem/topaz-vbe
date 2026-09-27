function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString('en-GB');
}

function fmtGBP(v) {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return v;
  return '£' + n.toLocaleString('en-GB');
}

export default function DataTable({ caption, headers, rows, currency = false, totalsRow }) {
  const fmt = currency ? fmtGBP : fmtNum;
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        {caption && <caption style={{ textAlign: 'left', fontWeight: 'bold', padding: '4px 0', color: '#036' }}>{caption}</caption>}
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={i > 0 ? 'num' : ''}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={row._sectionHead ? 'section-head' : ''}>
              {row.cells
                ? row.cells.map((cell, ci) => (
                    <td key={ci} className={ci > 0 ? 'num' : ''}>
                      {ci > 0 ? fmt(cell) : cell}
                    </td>
                  ))
                : Object.values(row).map((cell, ci) => (
                    <td key={ci} className={ci > 0 ? 'num' : ''}>{ci > 0 ? fmt(cell) : cell}</td>
                  ))
              }
            </tr>
          ))}
          {totalsRow && (
            <tr className="totals">
              {totalsRow.map((cell, ci) => (
                <td key={ci} className={ci > 0 ? 'num' : ''}>{ci > 0 ? fmt(cell) : cell}</td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
