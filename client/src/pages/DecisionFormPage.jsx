import { PRODUCTS, AREAS, MIN_ASSEMBLY_TIME } from '../data/mockData.js';
import { validateAll } from '../logic/validation.js';

function FInput({ value, onChange, disabled, min, max, step = 1, className = 'df-inp', style = {} }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className={className}
      style={style}
    />
  );
}

function FCheck({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 10, fontSize: '0.9em' }}>
      <input type="checkbox" checked={!!checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)} />
      {label && <span>{label}</span>}
    </label>
  );
}

function Err({ msg }) {
  return msg ? <span className="df-err" title={msg}>!</span> : null;
}

// Thin row label cell
const TH = ({ children }) => (
  <th>{children}</th>
);
const TD = ({ children }) => (
  <td>{children}</td>
);

export default function DecisionFormPage({ dec, onChange, teamNumber, period, disabled, periodData, quarter, session, saveStatus, submitStatus }) {
  const machines        = periodData?.resources?.machinesAvailable || 6;
  const assemblyWorkers = periodData?.resources?.personnel?.assemblyWorkers?.nextQtr || 40;
  const salespeople     = periodData?.resources?.personnel?.salespeople?.nextQtr || 6;
  const vehicles        = periodData?.resources?.vehiclesAvailable || 4;
  const prevWage        = periodData?.decisions?.assemblyWage || 8.50;

  const context = { machines, assemblyWorkers, salespeople, quarter, prevAssemblyWage: prevWage, vehicles };
  const { errors, warnings } = validateAll(dec, context);
  const hasErrors = Object.keys(errors).length > 0;

  // ── Header display values ──────────────────────────────────────────────────
  const simCode     = session?.simulationCode || '—';
  const groupNum    = session?.groupNumber ?? 1;
  const year        = session?.startYear || '—';
  const identityNum = `ID-100${teamNumber}`;
  const status = submitStatus === 'submitted' ? 'Submitted'
    : saveStatus === 'saved' ? 'Saved'
    : disabled ? 'Submitted'
    : 'Not Submitted';

  // ── Helpers ────────────────────────────────────────────────────────────────
  function set(field, value) { onChange({ ...dec, [field]: value }); }

  function setPrice(type, p, v) {
    const prices = { ...dec.prices, [type]: [...dec.prices[type]] };
    prices[type][p] = v;
    onChange({ ...dec, prices });
  }

  function setPromotion(type, p, v) {
    const promotion = {
      tradePres:     [...(dec.promotion?.tradePres     || [0,0,0])],
      adSupport:     [...(dec.promotion?.adSupport     || [0,0,0])],
      support:       [...(dec.promotion?.support       || [0,0,0])],
      merchandising: [...(dec.promotion?.merchandising || [0,0,0])],
    };
    promotion[type][p] = v;
    onChange({ ...dec, promotion });
  }

  function setResearch(p, v) {
    const researchExp = [...(dec.researchExp || [0,0,0])];
    researchExp[p] = v;
    onChange({ ...dec, researchExp });
  }

  function setAlloc(a, v) {
    const salespeopleAlloc = [...dec.salespeopleAlloc];
    salespeopleAlloc[a] = v;
    onChange({ ...dec, salespeopleAlloc });
  }

  function setAsmTime(p, v) {
    const assemblyTimes = [...dec.assemblyTimes];
    assemblyTimes[p] = v;
    onChange({ ...dec, assemblyTimes });
  }

  function setDel(p, a, v) {
    const s = dec.deliverySchedule.map(r => [...r]);
    s[p][a] = v;
    onChange({ ...dec, deliverySchedule: s });
  }

  function setImprove(p, v) {
    const implementImprovement = [...dec.implementImprovement];
    implementImprovement[p] = v;
    onChange({ ...dec, implementImprovement });
  }

  // Salary: stored full £ → displayed as £'00
  const salaryDisplay = Math.round((dec.salespersonSalary || 0) / 100);
  // Budget: stored full £ → displayed as £'000
  const budgetDisplay = Math.round((dec.managementBudget  || 0) / 1000);

  // Promotion: stored full £ → displayed as £'000
  function promDisp(type, p) { return Math.round((dec.promotion?.[type]?.[p] || 0) / 1000); }
  function promSet(type, p, v) { setPromotion(type, p, Number(v) * 1000); }
  function resDisp(p) { return Math.round((dec.researchExp?.[p] || 0) / 1000); }
  function resSet(p, v) { setResearch(p, Number(v) * 1000); }

  const promErr = errors.promotion || {};
  const resErr  = errors.researchExp || [];

  const AREA_LABELS = AREAS; // ['Export','South','West','North']
  const P = [0, 1, 2];

  return (
    <div className="df-window">

      {/* ── Windows title bar ─────────────────────────────────────────────── */}
      <div className="df-titlebar">
        <span>Topaz_Vbe Team Decision Sheet</span>
        <div className="df-titlebar-btns">
          <span className="df-titlebar-btn">_</span>
          <span className="df-titlebar-btn">□</span>
          <span className="df-titlebar-btn">✕</span>
        </div>
      </div>

      <div className="df-body">

        {/* ── Status / error notices ───────────────────────────────────────── */}
        {disabled && (
          <div className="locked-notice" style={{ marginBottom: 4 }}>
            Period {period} submitted — decisions are read-only.
          </div>
        )}
        {hasErrors && !disabled && (
          <div className="df-warn-bar">
            <strong>{Object.keys(errors).length} validation error(s)</strong> — fix before submitting.
            {warnings.length > 0 && <> &nbsp;|&nbsp; <strong>{warnings.length} warning(s).</strong></>}
          </div>
        )}

        {/* ── Header: [Sim Data + Company Info] | [Brand box spanning both] ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 0, alignItems: 'stretch' }}>

          {/* Left: stacked Simulation Data + Company Information */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <fieldset className="df-fs-sim">
              <legend>Simulation Data</legend>
              <table><tbody>
                <tr>
                  <TH>Simulation Code</TH>
                  <TD><span className="df-val-box">{simCode}</span></TD>
                  <TH>Year:</TH>
                  <TD><span className="df-val-box">{year}</span></TD>
                  <TH>Quarter:</TH>
                  <TD><span className="df-val-box">{quarter}</span></TD>
                </tr>
              </tbody></table>
            </fieldset>

            <fieldset className="df-fs-company" style={{ flex: 1 }}>
              <legend>Company Information</legend>
              <table><thead>
                <tr>
                  <th>Group Number</th>
                  <th>Company Number</th>
                  <th>Identity Number</th>
                  <th>Status</th>
                </tr>
              </thead><tbody>
                <tr>
                  <td><span className="df-val-box">{groupNum}</span></td>
                  <td><span className="df-val-box">{teamNumber}</span></td>
                  <td><span className="df-val-box">{identityNum}</span></td>
                  <td><span className="df-val-box">{status}</span></td>
                </tr>
              </tbody></table>
            </fieldset>
          </div>

          {/* Right: brand box spanning full header height */}
          <div className="df-brand">
            <span>Topaz-vbe</span>
            <span>from Edit</span>
            <span>Systems Ltd</span>
          </div>

        </div>

        {/* ── Decision Data section header ─────────────────────────────────── */}
        <div className="df-dec-header">Decision Data</div>

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="df-grid">

          {/* ════ LEFT COLUMN ════════════════════════════════════════════════ */}
          <div className="df-col">

            {/* Product Improvements */}
            <fieldset className="df-fs">
              <legend>'Tick' to Implement Major Product Improvements (if any)</legend>
              <table><thead>
                <tr>
                  <th style={{ width: 160 }}/>
                  {PRODUCTS.map((_, p) => <th key={p}>Product {p+1}</th>)}
                </tr>
              </thead><tbody>
                <tr>
                  <td/>
                  {P.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <FCheck checked={dec.implementImprovement?.[p]} disabled={disabled}
                        onChange={v => setImprove(p, v)} />
                    </td>
                  ))}
                </tr>
              </tbody></table>
            </fieldset>

            {/* Prices */}
            <fieldset className="df-fs">
              <legend>Prices (£'s)</legend>
              <table><thead>
                <tr>
                  <th style={{ width: 100 }}/>
                  {PRODUCTS.map((_, p) => <th key={p}>Product {p+1}</th>)}
                </tr>
              </thead><tbody>
                <tr>
                  <TH>Export Market</TH>
                  {P.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <FInput value={dec.prices?.export?.[p]} disabled={disabled} min={0}
                        onChange={v => setPrice('export', p, v)} />
                      <Err msg={errors.prices?.export?.[p]} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <TH>Home Markets</TH>
                  {P.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <FInput value={dec.prices?.home?.[p]} disabled={disabled} min={0}
                        onChange={v => setPrice('home', p, v)} />
                      <Err msg={errors.prices?.home?.[p]} />
                    </td>
                  ))}
                </tr>
              </tbody></table>
            </fieldset>

            {/* Promotion Expenditure */}
            <fieldset className="df-fs">
              <legend>Promotion Expenditure (£'000)</legend>
              <table><thead>
                <tr>
                  <th style={{ width: 120 }}/>
                  {PRODUCTS.map((_, p) => <th key={p}>Product {p+1}</th>)}
                </tr>
              </thead><tbody>
                {[
                  { key: 'tradePres',     label: 'Trade Press' },
                  { key: 'adSupport',     label: 'Advertising Support' },
                  { key: 'support',       label: 'Support' },
                  { key: 'merchandising', label: 'Merchandising' },
                ].map(({ key, label }) => (
                  <tr key={key}>
                    <TH>{label}</TH>
                    {P.map(p => (
                      <td key={p} style={{ textAlign: 'center' }}>
                        <FInput value={promDisp(key, p)} disabled={disabled} min={0}
                          onChange={v => promSet(key, p, v)} />
                        <Err msg={promErr[key]?.[p]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody></table>
            </fieldset>

            {/* Assembly Time */}
            <fieldset className="df-fs">
              <legend>Assembly Time: (Minutes)</legend>
              <table><thead>
                <tr>
                  <th style={{ width: 60 }}/>
                  {PRODUCTS.map((_, p) => <th key={p}>Product {p+1} (≥{MIN_ASSEMBLY_TIME[p]})</th>)}
                </tr>
              </thead><tbody>
                <tr>
                  <td/>
                  {P.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <FInput value={dec.assemblyTimes?.[p]} disabled={disabled}
                        min={MIN_ASSEMBLY_TIME[p]} className="df-inp df-inp-w"
                        onChange={v => setAsmTime(p, v)} />
                      <Err msg={errors.assemblyTimes?.[p]} />
                    </td>
                  ))}
                </tr>
              </tbody></table>
            </fieldset>

            {/* Salespeople Allocated to Area */}
            <fieldset className="df-fs">
              <legend>Salespeople Allocated to Area</legend>
              <table><tbody>
                <tr>
                  {AREA_LABELS.map((area, a) => (
                    <>
                      <th key={`lbl-${a}`}>{area} Area</th>
                      <td key={`inp-${a}`} style={{ textAlign: 'center' }}>
                        <FInput value={dec.salespeopleAlloc?.[a]} disabled={disabled} min={0}
                          onChange={v => setAlloc(a, v)} />
                        <Err msg={errors.salespeopleAlloc?.[a]} />
                      </td>
                    </>
                  ))}
                </tr>
              </tbody></table>
              {errors.salespeopleAlloc?.length > AREA_LABELS.length && (
                <div style={{ color: 'red', fontSize: '0.8em', padding: '2px 4px' }}>
                  {errors.salespeopleAlloc[errors.salespeopleAlloc.length - 1]}
                </div>
              )}
            </fieldset>

            {/* Salespeople's Remuneration */}
            <fieldset className="df-fs">
              <legend>Salespeople's Remuneration</legend>
              <table><tbody>
                <tr>
                  <TH>Quarterly Salary (£'00)</TH>
                  <td>
                    <FInput value={salaryDisplay} disabled={disabled} min={20}
                      className="df-inp df-inp-w"
                      onChange={v => set('salespersonSalary', Number(v) * 100)} />
                    <Err msg={errors.salespersonSalary} />
                  </td>
                  <TH>% Sales Commission</TH>
                  <td>
                    <FInput value={dec.salesCommission} disabled={disabled} min={0} max={100}
                      onChange={v => set('salesCommission', v)} />
                    <Err msg={errors.salesCommission} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Assembly Workers' wage + Shift level */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>Assembly Workers' hourly wage rate: (Pounds.Pence)</TH>
                  <td>
                    <FInput value={dec.assemblyWage} disabled={disabled}
                      min={8.50} step={0.01} className="df-inp df-inp-w"
                      onChange={v => set('assemblyWage', v)} />
                    <Err msg={errors.assemblyWage} />
                  </td>
                  <TH>Shift level:</TH>
                  <td>
                    <select value={dec.shiftLevel || 1} disabled={disabled}
                      className="df-sel"
                      onChange={e => set('shiftLevel', parseInt(e.target.value))}>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                    <Err msg={errors.shiftLevel} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Management Budget */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>Quarterly Management Budget: (£'000)</TH>
                  <td>
                    <FInput value={budgetDisplay} disabled={disabled} min={40}
                      className="df-inp df-inp-w"
                      onChange={v => set('managementBudget', Number(v) * 1000)} />
                    <Err msg={errors.managementBudget} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Contract Maintenance + Machines to Sell */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>Contract Maintenance hours:</TH>
                  <td>
                    <FInput value={dec.contractMaintenance} disabled={disabled} min={0}
                      onChange={v => set('contractMaintenance', v)} />
                    <Err msg={errors.contractMaintenance} />
                  </td>
                  <TH>Machines to Sell:</TH>
                  <td>
                    <FInput value={dec.machinesToSell} disabled={disabled} min={0}
                      onChange={v => set('machinesToSell', v)} />
                    <Err msg={errors.machinesToSell} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

          </div>{/* end LEFT COLUMN */}

          {/* Vertical divider */}
          <div className="df-vdiv" />

          {/* ════ RIGHT COLUMN ═══════════════════════════════════════════════ */}
          <div className="df-col">

            {/* Dividend Rate + Days Credit */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>Dividend Rate: (pence/share)</TH>
                  <td>
                    <FInput value={dec.dividendRate} disabled={disabled || [2,4].includes(quarter)} min={0}
                      onChange={v => set('dividendRate', v)} />
                    <Err msg={errors.dividendRate} />
                    {[2,4].includes(quarter) && (
                      <span style={{ fontSize: '0.78em', color: '#555', marginLeft: 3 }}>Q1/Q3 only</span>
                    )}
                  </td>
                  <TH>Days Credit Allowed:</TH>
                  <td>
                    <FInput value={dec.daysCredit} disabled={disabled} min={0}
                      onChange={v => set('daysCredit', v)} />
                    <Err msg={errors.daysCredit} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Vans */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>Vans to Buy:</TH>
                  <td>
                    <FInput value={dec.vansToBuy} disabled={disabled} min={0}
                      onChange={v => set('vansToBuy', v)} />
                    <Err msg={errors.vansToBuy} />
                  </td>
                  <TH>Vans to Sell:</TH>
                  <td>
                    <FInput value={dec.vansToSell} disabled={disabled} min={0}
                      onChange={v => set('vansToSell', v)} />
                    <Err msg={errors.vansToSell} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Information Wanted */}
            <fieldset className="df-fs">
              <legend>Information Wanted</legend>
              <table><tbody>
                <tr>
                  <td>
                    <FCheck label="on Other Companies" checked={dec.buyCompetitorInfo}
                      disabled={disabled} onChange={v => set('buyCompetitorInfo', v)} />
                  </td>
                  <td>
                    <FCheck label="on Market Shares" checked={dec.buyMarketShares}
                      disabled={disabled} onChange={v => set('buyMarketShares', v)} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Make and Deliver Products to */}
            <fieldset className="df-fs">
              <legend>Make and Deliver Products to:</legend>
              <table><thead>
                <tr>
                  <th style={{ width: 90 }}/>
                  {PRODUCTS.map((_, p) => <th key={p}>Product {p+1}</th>)}
                </tr>
              </thead><tbody>
                {AREA_LABELS.map((area, a) => (
                  <tr key={a}>
                    <TH>{area} Area</TH>
                    {P.map(p => (
                      <td key={p} style={{ textAlign: 'center' }}>
                        <FInput value={dec.deliverySchedule?.[p]?.[a]} disabled={disabled}
                          className="df-inp df-inp-w"
                          onChange={v => setDel(p, a, v)} />
                        <Err msg={errors.deliverySchedule?.[p]?.[a]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody></table>
            </fieldset>

            {/* Research Expenditure */}
            <fieldset className="df-fs">
              <legend>Research Expenditure:(£'000)</legend>
              <table><thead>
                <tr>
                  <th style={{ width: 60 }}/>
                  {PRODUCTS.map((_, p) => <th key={p}>Product {p+1}</th>)}
                </tr>
              </thead><tbody>
                <tr>
                  <td/>
                  {P.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <FInput value={resDisp(p)} disabled={disabled} min={0}
                        onChange={v => resSet(p, v)} />
                      <Err msg={resErr[p]} />
                    </td>
                  ))}
                </tr>
              </tbody></table>
            </fieldset>

            {/* Salespeople + Assembly Workers R/D/T */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>Salespeople</TH>
                  <TH>Recruit</TH>
                  <td>
                    <FInput value={dec.salespeopleRecruit} disabled={disabled} min={0}
                      onChange={v => set('salespeopleRecruit', v)} />
                    <Err msg={errors.salespeopleRecruit} />
                  </td>
                  <TH>Dismiss</TH>
                  <td>
                    <FInput value={dec.salespersonsDismiss} disabled={disabled} min={0}
                      onChange={v => set('salespersonsDismiss', v)} />
                    <Err msg={errors.salespersonsDismiss} />
                  </td>
                  <TH>Train</TH>
                  <td>
                    <FInput value={dec.salespersonsTrain} disabled={disabled} min={0}
                      onChange={v => set('salespersonsTrain', v)} />
                    <Err msg={errors.salespersonsTrain} />
                  </td>
                </tr>
                <tr>
                  <TH>Assembly Workers:</TH>
                  <TH>Recruit</TH>
                  <td>
                    <FInput value={dec.assemblyRecruit} disabled={disabled} min={0}
                      onChange={v => set('assemblyRecruit', v)} />
                    <Err msg={errors.assemblyRecruit} />
                  </td>
                  <TH>Dismiss</TH>
                  <td>
                    <FInput value={dec.assemblyDismiss} disabled={disabled} min={0}
                      onChange={v => set('assemblyDismiss', v)} />
                    <Err msg={errors.assemblyDismiss} />
                  </td>
                  <TH>Train</TH>
                  <td>
                    <FInput value={dec.assemblyTrain} disabled={disabled} min={0}
                      onChange={v => set('assemblyTrain', v)} />
                    <Err msg={errors.assemblyTrain} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* Raw Material */}
            <fieldset className="df-fs">
              <legend>Raw Material</legend>
              <table><tbody>
                <tr>
                  <TH>Units to Order</TH>
                  <td>
                    <FInput value={dec.materialsQty} disabled={disabled} min={0}
                      className="df-inp df-inp-w"
                      onChange={v => set('materialsQty', v)} />
                    <Err msg={errors.materialsQty} />
                  </td>
                  <TH>Supplier No.</TH>
                  <td>
                    <select value={dec.materialsSupplier ?? 0} disabled={disabled}
                      className="df-sel"
                      onChange={e => set('materialsSupplier', parseInt(e.target.value))}>
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </td>
                  <TH>No. of Deliveries</TH>
                  <td>
                    <FInput value={dec.materialsDeliveries} disabled={disabled} min={0}
                      onChange={v => set('materialsDeliveries', v)} />
                    <Err msg={errors.materialsDeliveries} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

            {/* New Machines to Order */}
            <fieldset className="df-fs">
              <table><tbody>
                <tr>
                  <TH>New Machines to Order:</TH>
                  <td>
                    <FInput value={dec.machinesToOrder} disabled={disabled} min={0}
                      onChange={v => set('machinesToOrder', v)} />
                    <Err msg={errors.machinesToOrder} />
                  </td>
                </tr>
              </tbody></table>
            </fieldset>

          </div>{/* end RIGHT COLUMN */}

        </div>{/* end df-grid */}

        {/* ── Capacity warnings ─────────────────────────────────────────────── */}
        {warnings.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {warnings.map((w, i) => (
              <div key={i} className="df-warn-bar">{w}</div>
            ))}
          </div>
        )}

        {/* ── Inline validation summary ─────────────────────────────────────── */}
        {!disabled && hasErrors && (
          <div style={{ marginTop: 4, fontSize: '0.85em', color: '#800' }}>
            Fix {Object.keys(errors).length} error(s) before submitting.
          </div>
        )}

      </div>{/* end df-body */}
    </div>
  );
}
