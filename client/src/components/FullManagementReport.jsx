// FullManagementReport.jsx — matches the Topaz-VBE printed report exactly (images 1–6)

const AREAS       = ['export', 'south', 'west', 'north'];
const AREA_LABELS = ['Export', 'South', 'West', 'North'];
const PRODUCTS    = [1, 2, 3];

// ── Formatting helpers ────────────────────────────────────────────────────────

function n(v, dec = 0) {
  if (v == null || v === '') return '—';
  const num = Number(v);
  if (!isFinite(num)) return '—';
  return num.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function gbp(v, dec = 0) {
  if (v == null || v === '') return '—';
  const num = Number(v);
  if (!isFinite(num)) return '—';
  const abs = Math.abs(num).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return num < 0 ? `-${abs}` : abs;
}

function chgStr(cur, prev) {
  if (cur == null || prev == null) return '—';
  const d = Number(cur) - Number(prev);
  if (!isFinite(d)) return '—';
  const abs = Math.abs(d).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return d > 0 ? `+${abs}` : d < 0 ? `-${abs}` : abs;
}

// ── Shared cell styles ────────────────────────────────────────────────────────

const S = {
  tbl:  { borderCollapse: 'collapse', width: '100%', marginBottom: 8 },
  th:   { border: '1px solid #999', background: '#d4d4d4', padding: '2px 6px', fontWeight: 'bold', textAlign: 'center', fontSize: '0.82em', whiteSpace: 'nowrap' },
  thL:  { border: '1px solid #999', background: '#d4d4d4', padding: '2px 6px', fontWeight: 'bold', textAlign: 'left',   fontSize: '0.82em' },
  td:   { border: '1px solid #bbb', background: '#fff', padding: '2px 6px', fontSize: '0.82em' },
  tdR:  { border: '1px solid #bbb', background: '#fff', padding: '2px 6px', fontSize: '0.82em', textAlign: 'right', fontFamily: 'monospace' },
  tdB:  { border: '1px solid #bbb', background: '#f0f0f0', padding: '2px 6px', fontSize: '0.82em', fontWeight: 'bold' },
  tdBR: { border: '1px solid #bbb', background: '#f0f0f0', padding: '2px 6px', fontSize: '0.82em', fontWeight: 'bold', textAlign: 'right', fontFamily: 'monospace' },
  tdL:  { border: '1px solid #bbb', background: '#fafafa', padding: '2px 6px', fontSize: '0.82em' },
  sec:  { marginTop: 14, marginBottom: 4, fontWeight: 'bold', fontSize: '0.88em', borderBottom: '2px solid #333', paddingBottom: 2 },
  sub:  { fontWeight: 'bold', fontSize: '0.84em', marginTop: 8, marginBottom: 2 },
};

// ── Section heading ───────────────────────────────────────────────────────────

function Sec({ children }) {
  return <div style={S.sec}>{children}</div>;
}

// ── Simple label + right-value row used in Resources ─────────────────────────

function LV({ label, value, bold, indent }) {
  return (
    <tr>
      <td style={{ ...S.tdL, fontWeight: bold ? 'bold' : 'normal', paddingLeft: indent ? 20 : 6 }}>{label}</td>
      <td style={bold ? S.tdBR : S.tdR}>{value ?? '—'}</td>
    </tr>
  );
}

// ── Product-map helper ────────────────────────────────────────────────────────

function prodMap(products) {
  const m = {};
  for (const p of (products || [])) m[`${p.area}:${p.product}`] = p;
  return m;
}
function gp(pm, area, prod) { return pm[`${area}:${prod}`] || {}; }

// ── Main component ────────────────────────────────────────────────────────────

export default function FullManagementReport({ report, prevReport }) {
  if (!report) return null;

  const meta = report.meta          || {};
  const d    = report.decisions     || {};
  const res  = report.resources     || {};
  const oh   = report.overheads     || {};
  const pnl  = report.pnl           || {};
  const bs   = report.balance_sheet || {};
  const cf   = report.cash_flow     || {};
  const eco  = report.economic      || {};
  const grp  = report.group         || {};
  const prods = report.products     || [];
  const pm   = prodMap(prods);

  const mach = res.machines  || {};
  const assy = res.assembly  || {};
  const veh  = res.vehicles  || {};
  const mats = res.materials || {};

  const pp  = prevReport?.pnl           || {};
  const pbs = prevReport?.balance_sheet || {};

  const ownGrp    = (grp.companies || []).find(c => c.company_number === meta.company_number) || {};
  const bankBal   = (bs.cash_invested || 0) - (bs.bank_overdraft || 0) - (bs.unsecured_loans || 0);
  const prevBankBal = prevReport
    ? ((prevReport.balance_sheet?.cash_invested || 0) - (prevReport.balance_sheet?.bank_overdraft || 0) - (prevReport.balance_sheet?.unsecured_loans || 0))
    : null;
  const prevProds = prevReport?.products || [];
  const prevSum   = key => prevProds.length ? prevProds.reduce((s, p) => s + (p[key] || 0), 0) : null;

  // Company Position row
  function CPRow({ label, cur, prev, isMoney }) {
    const c = cur  != null ? Number(cur)  : null;
    const p = prev != null ? Number(prev) : null;
    const chg = c != null && p != null ? c - p : null;
    const fmt = v => v == null ? '—' : isMoney === false ? n(v) : gbp(v);
    const fmtChg = v => {
      if (v == null) return '—';
      const abs = Math.abs(v).toLocaleString('en-GB');
      return v > 0 ? `+${abs}` : v < 0 ? `-${abs}` : abs;
    };
    return (
      <tr>
        <td style={S.tdL}>{label}</td>
        <td style={S.tdR}>{fmt(c)}</td>
        <td style={S.tdR}>{fmt(p)}</td>
        <td style={{ ...S.tdR, color: chg != null && chg < 0 ? '#c00' : chg != null && chg > 0 ? '#060' : 'inherit' }}>{fmtChg(chg)}</td>
      </tr>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', color: '#111', lineHeight: 1.4, background: '#fff', padding: '20px 28px', maxWidth: 860, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', borderTop: '3px solid #333', borderBottom: '2px solid #333', padding: '8px 0', marginBottom: 14 }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.15em', letterSpacing: 1 }}>THE TOPAZ MANAGEMENT SIMULATION REPORT</div>
        <div style={{ marginTop: 3 }}>
          Group {meta.group_number || 1}&nbsp;&nbsp;&nbsp;
          Company {meta.company_number}&nbsp;&nbsp;&nbsp;
          Year {meta.year}&nbsp;&nbsp;&nbsp;
          Quarter {meta.quarter}
        </div>
      </div>

      {/* ── 1. Company Position ────────────────────────────────────────────── */}
      <Sec>COMPANY POSITION at the end of {meta.year} Quarter {meta.quarter}</Sec>
      <table style={S.tbl}>
        <thead>
          <tr>
            <th style={{ ...S.thL, width: '50%' }}></th>
            <th style={S.th}>This quarter</th>
            <th style={S.th}>Previous</th>
            <th style={S.th}>Change</th>
          </tr>
        </thead>
        <tbody>
          <CPRow label="Share price"                         cur={ownGrp.share_price}    prev={(prevReport?.group?.companies||[]).find(c=>c.company_number===meta.company_number)?.share_price} isMoney={false} />
          <CPRow label="Net profit / loss"                   cur={pnl.net_profit}        prev={pp.net_profit} />
          <CPRow label="Sales revenue"                       cur={pnl.sales_revenue}     prev={pp.sales_revenue} />
          <CPRow label="Net worth"                           cur={bs.net_worth}          prev={pbs.net_worth} />
          <CPRow label="Bank balance (cash less borrowing)"  cur={bankBal}               prev={prevBankBal} />
          <CPRow label="Overdraft limit for next quarter"    cur={bs.overdraft_limit}    prev={pbs.overdraft_limit} />
          <CPRow label="Orders received"                     cur={prods.reduce((s,p)=>s+(p.demand||0),0)}       prev={prevSum('demand')}        isMoney={false} />
          <CPRow label="Units sold"                          cur={prods.reduce((s,p)=>s+(p.sales||0),0)}        prev={prevSum('sales')}         isMoney={false} />
          <CPRow label="Order backlog"                       cur={prods.reduce((s,p)=>s+(p.backlog||0),0)}      prev={prevSum('backlog')}       isMoney={false} />
          <CPRow label="Warehouse stock"                     cur={prods.reduce((s,p)=>s+(p.closing_stock||0),0)} prev={prevSum('closing_stock')} isMoney={false} />
          <CPRow label="Machine hours used"                  cur={mach.hours_used}       prev={prevReport?.resources?.machines?.hours_used}  isMoney={false} />
          <CPRow label="Assembly hours used"                 cur={assy.hours_used}       prev={prevReport?.resources?.assembly?.hours_used}  isMoney={false} />
        </tbody>
      </table>

      {/* ── 2. Decisions in effect ──────────────────────────────────────────── */}
      <Sec>DECISIONS in effect for {meta.year} Quarter {meta.quarter}</Sec>

      {/* Product decision table */}
      <table style={{ ...S.tbl, width: 'auto' }}>
        <thead>
          <tr>
            <th style={{ ...S.thL, minWidth: 270 }}></th>
            <th style={S.th}>Product 1</th>
            <th style={S.th}>Product 2</th>
            <th style={S.th}>Product 3</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Take up Major Product Improvements', PRODUCTS.map(p => d.product_improvements?.[p-1] ? '1' : '0')],
            ["Product Prices (£): Export Area",    PRODUCTS.map(p => gbp(d.prices?.export?.[p-1]))],
            ['Home Areas',                          PRODUCTS.map(p => gbp(d.prices?.home?.[p-1]))],
            ["Advertising (£'000): Trade Press",   PRODUCTS.map(p => gbp(d.promotion?.trade_press?.[p-1]))],
            ['Press & TV',                          PRODUCTS.map(p => gbp(d.promotion?.advertising?.[p-1]))],
            ['Merchandising',                       PRODUCTS.map(p => gbp(d.promotion?.merchandising?.[p-1]))],
            ['Product Assembly Times (mins)',        PRODUCTS.map(p => gbp(d.assembly_time_minutes?.[p-1]))],
            ["Product Development (£'000)",         PRODUCTS.map(() => gbp(d.research_expenditure_000))],
          ].map(([label, vals]) => (
            <tr key={label}>
              <td style={S.tdL}>{label}</td>
              {vals.map((v, i) => <td key={i} style={S.tdR}>{v}</td>)}
            </tr>
          ))}
          {/* Make and deliver rows */}
          {AREAS.map((a, ai) => (
            <tr key={a}>
              <td style={{ ...S.tdL, paddingLeft: ai === 0 ? 6 : 18 }}>
                {ai === 0 ? 'Make and deliver to: Export' : AREA_LABELS[ai]}
              </td>
              {PRODUCTS.map(p => <td key={p} style={S.tdR}>{gbp(d.make_deliver?.[a]?.[p-1])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Salespeople + misc decisions */}
      <table style={{ ...S.tbl, width: 'auto' }}>
        <tbody>
          <tr>
            <td style={{ ...S.tdB, minWidth: 270 }}>Salespeople allocated to:</td>
            <td style={S.th}>Export</td>
            <td style={S.th}>South</td>
            <td style={S.th}>West</td>
            <td style={S.th}>North</td>
          </tr>
          <tr>
            <td style={S.td}></td>
            {AREAS.map(a => <td key={a} style={S.tdR}>{gbp(d.salespeople?.[a])}</td>)}
          </tr>
          <tr>
            <td style={S.tdL}>Salespeople Quarterly Salary (£'00)</td>
            <td style={S.tdR}>{gbp(d.sales_remuneration?.quarterly_salary_000)}</td>
            <td style={S.tdL}>Commission %</td>
            <td colSpan={2} style={S.tdR}>{gbp(d.sales_remuneration?.commission_pct)}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Assembly Wages / hour (£.p)</td>
            <td colSpan={4} style={S.tdR}>{d.assembly_wage != null ? `${d.assembly_wage.pounds ?? 0}.${String(d.assembly_wage.pence ?? 0).padStart(2,'0')}` : '—'}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Maintenance Hours per Machine</td>
            <td style={S.tdR}>{gbp(d.contract_maintenance_hours)}</td>
            <td style={S.tdL}>Shift Level</td>
            <td colSpan={2} style={S.tdR}>{gbp(d.shift_level)}</td>
          </tr>
          <tr>
            <td style={S.tdL}>New Machines to Order</td>
            <td style={S.tdR}>{gbp(d.new_machines_to_order)}</td>
            <td style={S.tdL}>Machines to Sell</td>
            <td colSpan={2} style={S.tdR}>{gbp(d.machines_to_sell)}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Management Budget (£'000)</td>
            <td colSpan={4} style={S.tdR}>{gbp(d.management_budget_000)}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Dividend (pence per share)</td>
            <td style={S.tdR}>{gbp(d.dividend_rate_pence)}</td>
            <td style={S.tdL}>Credit Days Allowed</td>
            <td colSpan={2} style={S.tdR}>{gbp(d.days_credit_allowed)}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Vehicles to Buy</td>
            <td style={S.tdR}>{gbp(d.vans_to_buy)}</td>
            <td style={S.tdL}>Vehicles to Sell</td>
            <td colSpan={2} style={S.tdR}>{gbp(d.vans_to_sell)}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Information on company activities</td>
            <td style={S.tdR}>{d.info_wanted?.other_companies ? '1' : '2'}</td>
            <td style={S.tdL}>on Market Shares</td>
            <td colSpan={2} style={S.tdR}>{d.info_wanted?.market_shares ? '1' : '2'}</td>
          </tr>
          {/* Personnel */}
          <tr>
            <td style={S.tdB}>Personnel:</td>
            <td style={S.th}>Recruit</td>
            <td style={S.th}>Dismiss</td>
            <td colSpan={2} style={S.th}>Train</td>
          </tr>
          {[
            ['Salespeople',      d.salespeople_changes],
            ['Assembly Workers', d.assembly_changes],
          ].map(([label, ch]) => (
            <tr key={label}>
              <td style={S.tdL}>{label}</td>
              <td style={S.tdR}>{gbp(ch?.recruit)}</td>
              <td style={S.tdR}>{gbp(ch?.dismiss)}</td>
              <td colSpan={2} style={S.tdR}>{gbp(ch?.train)}</td>
            </tr>
          ))}
          {/* Materials */}
          <tr>
            <td style={S.tdB}>Materials to Order:</td>
            <td style={S.th}>Units</td>
            <td style={S.th}>Supplier</td>
            <td colSpan={2} style={S.th}>Deliveries</td>
          </tr>
          <tr>
            <td style={S.td}></td>
            <td style={S.tdR}>{gbp(d.raw_material?.units_to_order)}</td>
            <td style={S.tdR}>{gbp(d.raw_material?.supplier_no)}</td>
            <td colSpan={2} style={S.tdR}>{gbp(d.raw_material?.num_deliveries)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── 3. Availability and Use of Resources ────────────────────────────── */}
      <Sec>AVAILABILITY and USE OF RESOURCES</Sec>
      <table style={{ ...S.tbl, width: 'auto', minWidth: 340 }}>
        <tbody>
          <LV label="Machines Available Last Quarter"      value={gbp((mach.owned||0)-(mach.new_installed||0)+(mach.sold||0))} bold />
          <LV label="Machines Decommissioned"              value={gbp(mach.sold)} />
          <LV label="Machines Installed"                   value={gbp(mach.new_installed)} />
          <LV label="Machines Available for Next Quarter"  value={gbp(mach.owned)} bold />
          <LV label="Vehicles Available Last Quarter"      value={gbp((veh.owned||0)-(veh.bought||0)+(veh.sold||0))} />
          <tr><td colSpan={2} style={S.tdB}>Assembly Workers Hours:</td></tr>
          <LV label="Total Hours Available Last Quarter"   value={gbp(assy.hours_available)} indent />
          <LV label="Hours of Absenteeism/Sickness"        value="0" indent />
          <LV label="Total Hours Worked Last Quarter"      value={gbp(assy.hours_used)} indent />
          <LV label="Notice of Strike Weeks Next Quarter"  value={eco.strike_weeks_next != null ? gbp(eco.strike_weeks_next) : '0'} indent />
          <tr><td colSpan={2} style={S.tdB}>Machine Hours:</td></tr>
          <LV label="Total Hours Available Last Quarter"   value={gbp(mach.hours_available)} indent />
          <LV label="Hours Breakdown (Machining)"            value={gbp(mach.hours_used)} indent />
          <LV label="Hours of Planned Maintenance"         value={gbp((d.contract_maintenance_hours || 0) * (mach.owned || 0))} indent />
          <LV label="Total Hours Worked Last Quarter"      value={gbp(mach.hours_used)} indent />
          <LV label="Average Machine Efficiency %"         value={mach.utilisation_pct != null ? `${mach.utilisation_pct}` : '—'} indent />
          <tr><td colSpan={2} style={S.tdB}>Material Units Used and Available:</td></tr>
          <LV label="Opening Stock Available (units)"      value={gbp(mats.opening_stock)} indent />
          <LV label="Delivered Last Quarter"               value={gbp(mats.delivered)} indent />
          <LV label="Used Last Quarter"                    value={gbp(mats.used)} indent />
          <LV label="Closing Stock at End of Quarter"      value={gbp(mats.closing_stock)} indent />
          <LV label="On Order for Next Quarter"            value={gbp(mats.ordered)} indent />
          <LV label="Total Available for Next Quarter"     value={gbp((mats.closing_stock||0)+(mats.ordered||0))} bold />
        </tbody>
      </table>

      {/* Personnel table */}
      <table style={{ ...S.tbl, width: 'auto' }}>
        <thead>
          <tr>
            <th style={{ ...S.thL, minWidth: 220 }}>Personnel:</th>
            <th style={S.th}>Sales</th>
            <th style={S.th}>Assembly</th>
            <th style={S.th}>Machinists</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const prevSpTotal = prevReport
              ? gbp(AREAS.reduce((s, a) => s + (prevReport.decisions?.salespeople?.[a] || 0), 0))
              : '—';
            const curSpTotal = gbp(AREAS.reduce((s, a) => s + (d.salespeople?.[a] || 0), 0));
            return [
              ['At Start of Last Quarter', prevSpTotal, gbp(prevReport?.resources?.assembly?.workers), gbp(prevReport?.resources?.machines?.machinists)],
              ['Recruits',    gbp(d.salespeople_changes?.recruit), gbp(d.assembly_changes?.recruit),  null],
              ['Trainees',    gbp(d.salespeople_changes?.train),   gbp(d.assembly_changes?.train),    null],
              ['Dismissals',  gbp(d.salespeople_changes?.dismiss), gbp(d.assembly_changes?.dismiss),  null],
              ['Leavers',     '0', '0', '0'],
              ['Available for Next Quarter', curSpTotal, gbp(assy.workers), gbp(mach.machinists)],
            ];
          })().map(([label, s, a, m]) => (
            <tr key={label}>
              <td style={S.tdL}>{label}</td>
              <td style={S.tdR}>{s ?? '—'}</td>
              <td style={S.tdR}>{a ?? '—'}</td>
              <td style={S.tdR}>{m ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 4. Product Movements and Availability ──────────────────────────── */}
      <Sec>PRODUCT MOVEMENTS and AVAILABILITY</Sec>
      <table style={{ ...S.tbl, width: 'auto' }}>
        <thead>
          <tr>
            <th style={{ ...S.thL, minWidth: 220 }}>Quantities</th>
            <th style={S.th}>Product 1</th>
            <th style={S.th}>Product 2</th>
            <th style={S.th}>Product 3</th>
          </tr>
        </thead>
        <tbody>
          {[['Scheduled','scheduled'],['Produced','produced'],['Rejected','rejected'],['Serviced','serviced']].map(([label, key]) => (
            <tr key={label}>
              <td style={S.tdL}>{label}</td>
              {PRODUCTS.map(p => {
                const total = AREAS.reduce((s, a) => s + (gp(pm, a, p)[key] || 0), 0);
                return <td key={p} style={S.tdR}>{gbp(total)}</td>;
              })}
            </tr>
          ))}

          {[
            ['Delivered to:', 'delivered'],
            ['Orders from:',  'demand'],
            ['Sales to:',     'sales'],
            ['Order Backlog:', 'backlog'],
            ['Warehouse Stock:', 'closing_stock'],
          ].map(([sectionLabel, key]) => (
            <>
              <tr key={sectionLabel}>
                <td colSpan={4} style={S.tdB}>{sectionLabel}</td>
              </tr>
              {AREAS.map((a, ai) => (
                <tr key={`${sectionLabel}-${a}`}>
                  <td style={{ ...S.tdL, paddingLeft: 20 }}>{AREA_LABELS[ai]}</td>
                  {PRODUCTS.map(p => <td key={p} style={S.tdR}>{gbp(gp(pm, a, p)[key])}</td>)}
                </tr>
              ))}
            </>
          ))}

          <tr>
            <td style={S.tdB}>Product Improvements</td>
            {PRODUCTS.map(p => (
              <td key={p} style={{ ...S.tdR, fontWeight: 'bold' }}>
                {d.product_improvements?.[p-1] ? 'DONE' : 'NONE'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* ── 5. Accounts ─────────────────────────────────────────────────────── */}
      <Sec>ACCOUNTS</Sec>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 10 }}>

        {/* LEFT: Overhead Cost Analysis */}
        <div>
          <div style={S.sub}>Overhead Cost Analysis</div>
          <table style={S.tbl}>
            <tbody>
              {[
                ['Advertising',               (oh.advertising||0)+(oh.trade_press||0)+(oh.support||0)+(oh.merchandising||0)],
                ['Salespeoples Salary, etc.',  oh.sales_force],
                ['Sales Office',              oh.supervision],
                ['Guarantee Servicing',       oh.guarantee_servicing],
                ['Transport Fleet',           oh.production_overheads],
                ['Hired Transport',           0],
                ['Product Research',          oh.research],
                ['Personnel Department',      (oh.planning||0) + (oh.personnel_costs||0)],
                ['Maintenance',               oh.maintenance],
                ['Warehousing & Purchasing',  oh.warehousing],
                ['Business Intelligence',     oh.info_charges],
                ['Management Budget',         oh.management],
                ['Credit Control',            oh.credit_control],
                ['Other Miscellaneous Costs', (oh.fixed_overheads||0)+(oh.variable_overhead||0)],
              ].map(([label, val]) => (
                <tr key={label}><td style={S.tdL}>{label}</td><td style={S.tdR}>{gbp(val)}</td></tr>
              ))}
              <tr><td style={S.tdB}>Total Overheads</td><td style={S.tdBR}>{gbp(oh.total)}</td></tr>
              <tr><td style={S.tdL}>Taxable Profit/Loss Accumulated</td><td style={S.tdR}>{gbp(pnl.profit_before_tax)}</td></tr>
            </tbody>
          </table>

          <div style={S.sub}>Balance Sheet</div>
          <div style={{ fontStyle: 'italic', fontSize: '0.8em', marginBottom: 2 }}>Assets</div>
          <table style={S.tbl}>
            <tbody>
              {[
                ['Value of Property',       bs.property],
                ['Value of Machines',       bs.machines],
                ['Value of Vehicles',       bs.vehicles],
                ['Value of Product Stocks', bs.product_stocks],
                ['Value of Material Stock', bs.material_stocks],
                ['Debtors',                 bs.debtors],
                ['Cash Invested',           bs.cash_invested],
              ].map(([label, val]) => (
                <tr key={label}><td style={S.tdL}>{label}</td><td style={S.tdR}>{gbp(val)}</td></tr>
              ))}
              <tr><td colSpan={2} style={{ ...S.td, fontStyle: 'italic', fontWeight: 'bold', fontSize: '0.8em' }}>Liabilities</td></tr>
              {[
                ['Tax Assessed and Due', bs.tax_due],
                ['Creditors',           bs.creditors],
                ['Overdraft',           bs.bank_overdraft],
                ['Unsecured Loans',     bs.unsecured_loans],
              ].map(([label, val]) => (
                <tr key={label}><td style={S.tdL}>{label}</td><td style={S.tdR}>{gbp(val)}</td></tr>
              ))}
              <tr><td style={S.tdB}>Net Assets</td><td style={S.tdBR}>{gbp(bs.net_assets ?? bs.net_worth)}</td></tr>
              {[
                ['Ordinary Capital', bs.share_capital],
                ['Reserves',        bs.reserves],
              ].map(([label, val]) => (
                <tr key={label}><td style={S.tdL}>{label}</td><td style={S.tdR}>{gbp(val)}</td></tr>
              ))}
              <tr><td style={S.tdB}>Total Funding</td><td style={S.tdBR}>{gbp(bs.net_worth)}</td></tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT: P&L + Cash Flow */}
        <div>
          <div style={S.sub}>Profit and Loss Account</div>
          <table style={S.tbl}>
            <tbody>
              {[
                ['Sales Revenue',             pnl.sales_revenue,       false],
                ['Opening Stock Value',       pnl.opening_stock_value, false],
                ['Materials Purchased',       pnl.materials,           false],
                ['Assembly Wages',            pnl.assembly_wages,      false],
                ['Machinists Wages',          pnl.machinists_wages,    false],
                ['Machine Running Costs',     pnl.machine_running,     false],
                ['Less Closing Stock Value',  pnl.closing_stock_value, false],
                ['Cost of Sales',             pnl.cost_of_sales,       true],
                ['Gross Profit',              pnl.gross_profit,        true],
                ['Interest received',         pnl.interest_received,   false],
                ['Interest Paid',             pnl.interest_paid,       false],
                ['Overheads',                 pnl.total_overheads,     false],
                ['Depreciation',              pnl.depreciation,        false],
                ['Tax Assessed',              pnl.tax_assessed,        false],
                ['Net Profit/Loss',           pnl.net_profit,          true],
                ['Dividend Paid',             pnl.dividend_paid,       false],
                ['Transferred to Reserves',   pnl.retained_profit,     false],
              ].map(([label, val, bold]) => (
                <tr key={label}>
                  <td style={{ ...S.tdL, fontWeight: bold ? 'bold' : 'normal' }}>{label}</td>
                  <td style={{ ...(bold ? S.tdBR : S.tdR) }}>{gbp(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={S.sub}>Cash Flow Statement</div>
          <table style={S.tbl}>
            <tbody>
              <tr><td colSpan={2} style={{ ...S.td, fontStyle: 'italic', fontWeight: 'bold' }}>Operating Activities:</td></tr>
              {[
                ['Trading Receipts',                    cf.trading_receipts, false],
                ['Trading Payments',                    cf.trading_payments, false],
                ['Tax Paid',                            cf.tax_paid,         false],
                ['Cash flow from operating activities', cf.net_operating,    true],
              ].map(([label, val, bold]) => (
                <tr key={label}>
                  <td style={{ ...S.tdL, paddingLeft: bold ? 6 : 18, fontWeight: bold ? 'bold' : 'normal' }}>{label}</td>
                  <td style={bold ? S.tdBR : S.tdR}>{gbp(val)}</td>
                </tr>
              ))}
              <tr><td colSpan={2} style={{ ...S.td, fontStyle: 'italic', fontWeight: 'bold' }}>Investing Activities:</td></tr>
              {[
                ['Interest Received',                   cf.interest_received, false],
                ['Capital Receipts',                    cf.capital_receipts,  false],
                ['Capital Payments',                    cf.capital_payments,  false],
                ['Cash flow from investing activities', cf.net_investing,     true],
              ].map(([label, val, bold]) => (
                <tr key={label}>
                  <td style={{ ...S.tdL, paddingLeft: bold ? 6 : 18, fontWeight: bold ? 'bold' : 'normal' }}>{label}</td>
                  <td style={bold ? S.tdBR : S.tdR}>{gbp(val)}</td>
                </tr>
              ))}
              <tr><td colSpan={2} style={{ ...S.td, fontStyle: 'italic', fontWeight: 'bold' }}>Financing Activities:</td></tr>
              {[
                ['Interest Paid',                       cf.interest_paid,    false],
                ['Dividend Paid',                       cf.dividends_paid,   false],
                ['Cash flow from financing activities', cf.net_financing,    true],
                ['Net Cash Flow',                       cf.net_cash_flow,    true],
                ['Overdraft Limit for Next Quarter',    bs.overdraft_limit,  false],
              ].map(([label, val, bold]) => (
                <tr key={label}>
                  <td style={{ ...S.tdL, paddingLeft: bold ? 6 : 18, fontWeight: bold ? 'bold' : 'normal' }}>{label}</td>
                  <td style={bold ? S.tdBR : S.tdR}>{gbp(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Business Intelligence ─────────────────────────────────────────── */}
      <Sec>BUSINESS INTELLIGENCE</Sec>
      <table style={{ ...S.tbl, width: 'auto' }}>
        <tbody>
          <tr>
            <td style={{ ...S.tdL, minWidth: 300 }}>Share Price (pence/share)</td>
            <td style={S.tdR}>{ownGrp.share_price ?? '—'}</td>
          </tr>
          <tr>
            <td style={S.tdL}>Dividend Paid (%)</td>
            <td style={S.tdR}>{ownGrp.dividend_pct != null ? Number(ownGrp.dividend_pct).toFixed(1) : '—'}</td>
          </tr>
        </tbody>
      </table>
      {d.info_wanted?.other_companies && (grp.companies || []).length > 1 && (
        <>
          <div style={S.sub}>Group Company Data</div>
          <table style={{ ...S.tbl, width: 'auto' }}>
            <thead>
              <tr>
                <th style={S.th}>Co.</th>
                <th style={S.th}>Share Price (p)</th>
                <th style={S.th}>Dividend (%)</th>
                <th style={S.th}>Net Profit</th>
                <th style={S.th}>Net Worth</th>
              </tr>
            </thead>
            <tbody>
              {(grp.companies || []).map(c => (
                <tr key={c.company_number}>
                  <td style={S.tdR}>{c.company_number}</td>
                  <td style={S.tdR}>{c.share_price ?? '—'}</td>
                  <td style={S.tdR}>{c.dividend_pct != null ? Number(c.dividend_pct).toFixed(1) : '—'}</td>
                  <td style={S.tdR}>{gbp(c.net_profit)}</td>
                  <td style={S.tdR}>{gbp(c.net_worth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {d.info_wanted?.market_shares && (grp.market_shares) && (
        <>
          <div style={S.sub}>Market Shares (%)</div>
          <table style={{ ...S.tbl, width: 'auto' }}>
            <thead>
              <tr>
                <th style={S.thL}>Area / Product</th>
                {(grp.companies || []).map(c => <th key={c.company_number} style={S.th}>Co.{c.company_number}</th>)}
              </tr>
            </thead>
            <tbody>
              {AREAS.flatMap((a, ai) =>
                PRODUCTS.map(p => (
                  <tr key={`${a}-${p}`}>
                    <td style={S.tdL}>{AREA_LABELS[ai]} — Product {p}</td>
                    {(grp.companies || []).map((c, ci) => {
                      const pct = grp.market_shares?.[a]?.[p]?.[ci];
                      return <td key={c.company_number} style={S.tdR}>{pct != null ? (pct * 100).toFixed(1) : '—'}</td>;
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── 7. Economic Information ──────────────────────────────────────────── */}
      <Sec>ECONOMIC INFORMATION</Sec>
      <table style={{ ...S.tbl, width: 'auto' }}>
        <tbody>
          {[
            ['Gross Domestic Product Last Quarter (deseasonalised)',      eco.gdp_growth_pct],
            ['% Unemployed Rate Last Quarter (deseasonalised)',           eco.unemployment_pct],
            ['% Annual Central Bank Rate from Next Quarter',              eco.central_bank_rate],
            ["Price of Material ordered for Next Quarter (£ per '000)",  eco.material_price_next_q],
          ].map(([label, val]) => (
            <tr key={label}>
              <td style={{ ...S.tdL, minWidth: 420 }}>{label}</td>
              <td style={S.tdR}>{val ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
