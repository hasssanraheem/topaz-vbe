import { useState } from 'react';
import { PRODUCTS, AREAS, MIN_ASSEMBLY_TIME } from '../data/mockData.js';
import { validateAll } from '../logic/validation.js';
import { saveDecisions } from '../logic/storage.js';
import Button from '../components/Button.jsx';

// Compact input used throughout the image-matching form
function FInput({ value, onChange, disabled, min, max, step = 1, style = {} }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{ width: 52, textAlign: 'center', ...style }}
    />
  );
}

// Checkbox with label inline
function FCheck({ label, checked, onChange, disabled }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 12 }}>
      <input type="checkbox" checked={!!checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)} />
      {label && <span>{label}</span>}
    </label>
  );
}

// Error badge shown next to an input when invalid
function Err({ msg }) {
  return msg ? <span style={{ color: 'red', fontSize: '0.75em', marginLeft: 2 }} title={msg}>⚠</span> : null;
}

// Section box matching the original form's bordered group style
function Section({ title, children, style = {} }) {
  return (
    <fieldset style={{ border: '1px solid #888', padding: '4px 8px', marginBottom: 6, ...style }}>
      {title && <legend style={{ fontSize: '0.78em', fontWeight: 600, padding: '0 4px' }}>{title}</legend>}
      {children}
    </fieldset>
  );
}

// Small label cell for table rows
const TH = ({ children, right }) => (
  <th style={{ fontSize: '0.78em', textAlign: right ? 'right' : 'left', padding: '2px 4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
    {children}
  </th>
);
const TD = ({ children, center }) => (
  <td style={{ padding: '2px 4px', textAlign: center ? 'center' : 'left' }}>{children}</td>
);

export default function DecisionFormPage({ dec, onChange, teamNumber, period, disabled, periodData, quarter, session, onNavigate }) {
  const [saveMsg, setSaveMsg] = useState('');

  const machines       = periodData?.resources?.machinesAvailable || 6;
  const assemblyWorkers = periodData?.resources?.personnel?.assemblyWorkers?.nextQtr || 40;
  const salespeople    = periodData?.resources?.personnel?.salespeople?.nextQtr || 6;
  const vehicles       = periodData?.resources?.vehiclesAvailable || 4;
  const prevWage       = periodData?.decisions?.assemblyWage || 8.50;

  const context = { machines, assemblyWorkers, salespeople, quarter, prevAssemblyWage: prevWage, vehicles };
  const { errors, warnings } = validateAll(dec, context);
  const hasErrors = Object.keys(errors).length > 0;

  // ── Header display values ──────────────────────────────────────────────────
  const simCode    = session?.simulationCode || '—';
  const groupNum   = session?.groupNumber || '—';
  const year       = session?.startYear
    ? session.startYear + Math.floor((period - 1) / 4)
    : '—';
  // TODO: confirm Identity Number field with client — showing '—' for now
  const identityNum = '—';
  const status = disabled ? 'Submitted' : 'Not Submitted';

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

  function save() {
    if (saveDecisions(teamNumber, period, dec)) {
      setSaveMsg('Saved.');
    } else {
      setSaveMsg('Save failed.');
    }
    setTimeout(() => setSaveMsg(''), 2500);
  }

  // Salary and budget: stored in full £, displayed scaled
  const salaryDisplay  = Math.round((dec.salespersonSalary || 0) / 100); // £'00
  const budgetDisplay  = Math.round((dec.managementBudget  || 0) / 1000); // £'000

  // Promotion: stored in full £, displayed in £'000
  function promDisp(type, p) { return Math.round((dec.promotion?.[type]?.[p] || 0) / 1000); }
  function promSet(type, p, v) { setPromotion(type, p, Number(v) * 1000); }
  function resDisp(p) { return Math.round((dec.researchExp?.[p] || 0) / 1000); }
  function resSet(p, v) { setResearch(p, Number(v) * 1000); }

  const promErr = errors.promotion || {};
  const resErr  = errors.researchExp || [];

  // Delivery area order from AREAS: ['Export','South','West','North']
  const AREA_LABELS = AREAS; // ['Export','South','West','North']

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '0.82em' }}>
      {disabled && (
        <div className="locked-notice" style={{ marginBottom: 6 }}>
          Period {period} submitted — decisions are read-only.
        </div>
      )}

      {hasErrors && !disabled && (
        <div style={{ background: '#fee', border: '1px solid red', padding: '4px 8px', marginBottom: 6, fontSize: '0.85em' }}>
          <strong>{Object.keys(errors).length} validation error(s)</strong> — fix before submitting.
          {warnings.length > 0 && <> &nbsp;|&nbsp; <strong>{warnings.length} warning(s).</strong></>}
        </div>
      )}

      {/* ── Simulation Data + Company Info header ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <Section title="Simulation Data" style={{ flex: 1 }}>
          <table><tbody>
            <tr>
              <TH>Simulation Code</TH>
              <TD><span style={{ fontWeight: 600 }}>{simCode}</span></TD>
              <TH>Year</TH>
              <TD><span style={{ fontWeight: 600 }}>{year}</span></TD>
              <TH>Quarter</TH>
              <TD><span style={{ fontWeight: 600 }}>{quarter}</span></TD>
            </tr>
          </tbody></table>
        </Section>
        <Section title="Company Information" style={{ flex: 2 }}>
          <table><tbody>
            <tr>
              <TH>Group Number</TH><TD><strong>{groupNum}</strong></TD>
              <TH>Company Number</TH><TD><strong>{teamNumber}</strong></TD>
              <TH>Identity Number</TH>
              <TD><strong>{identityNum}</strong>{/* TODO: confirm with client */}</TD>
              <TH>Status</TH><TD><strong>{status}</strong></TD>
            </tr>
          </tbody></table>
        </Section>
      </div>

      {/* ── Decision Data: two-column layout ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'start' }}>

        {/* ════ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Product Improvements */}
          <Section title="'Tick' to Implement Major Product Improvements (if any)">
            <table><thead>
              <tr><TH/>{PRODUCTS.map((_, p) => <TH key={p}>Product {p+1}</TH>)}</tr>
            </thead><tbody>
              <tr>
                <TH/>
                {PRODUCTS.map((_, p) => (
                  <TD key={p} center>
                    <FCheck checked={dec.implementImprovement?.[p]} disabled={disabled}
                      onChange={v => setImprove(p, v)} />
                  </TD>
                ))}
              </tr>
            </tbody></table>
          </Section>

          {/* Prices */}
          <Section title="Prices (£'s)">
            <table><thead>
              <tr><TH/>{PRODUCTS.map((_, p) => <TH key={p}>Product {p+1}</TH>)}</tr>
            </thead><tbody>
              <tr>
                <TH>Export Market</TH>
                {PRODUCTS.map((_, p) => (
                  <TD key={p} center>
                    <FInput value={dec.prices?.export?.[p]} disabled={disabled} min={0}
                      onChange={v => setPrice('export', p, v)} />
                    <Err msg={errors.prices?.export?.[p]} />
                  </TD>
                ))}
              </tr>
              <tr>
                <TH>Home Markets</TH>
                {PRODUCTS.map((_, p) => (
                  <TD key={p} center>
                    <FInput value={dec.prices?.home?.[p]} disabled={disabled} min={0}
                      onChange={v => setPrice('home', p, v)} />
                    <Err msg={errors.prices?.home?.[p]} />
                  </TD>
                ))}
              </tr>
            </tbody></table>
          </Section>

          {/* Promotion Expenditure */}
          <Section title="Promotion Expenditure (£'000)">
            <table><thead>
              <tr><TH/>{PRODUCTS.map((_, p) => <TH key={p}>Product {p+1}</TH>)}</tr>
            </thead><tbody>
              {[
                { key: 'tradePres',     label: 'Trade Press' },
                { key: 'adSupport',     label: 'Advertising Support' },
                { key: 'merchandising', label: 'Merchandising' },
              ].map(({ key, label }) => (
                <tr key={key}>
                  <TH>{label}</TH>
                  {PRODUCTS.map((_, p) => (
                    <TD key={p} center>
                      <FInput value={promDisp(key, p)} disabled={disabled} min={0}
                        onChange={v => promSet(key, p, v)} />
                      <Err msg={promErr[key]?.[p]} />
                    </TD>
                  ))}
                </tr>
              ))}
            </tbody></table>
          </Section>

          {/* Assembly Time — per product in P1/P2/P3 columns (Note A: Option 2) */}
          <Section title="Assembly Time (Minutes)">
            <table><thead>
              <tr><TH/>{PRODUCTS.map((_, p) => <TH key={p}>Product {p+1} (≥{MIN_ASSEMBLY_TIME[p]})</TH>)}</tr>
            </thead><tbody>
              <tr>
                <TH/>
                {PRODUCTS.map((_, p) => (
                  <TD key={p} center>
                    <FInput value={dec.assemblyTimes?.[p]} disabled={disabled}
                      min={MIN_ASSEMBLY_TIME[p]}
                      onChange={v => setAsmTime(p, v)} style={{ width: 64 }} />
                    <Err msg={errors.assemblyTimes?.[p]} />
                  </TD>
                ))}
              </tr>
            </tbody></table>
          </Section>

          {/* Salespeople Allocated to Area */}
          <Section title="Salespeople Allocated to Area">
            <table><tbody>
              <tr>
                {AREA_LABELS.map((area, a) => (
                  <>
                    <TH key={`lbl-${a}`}>{area}</TH>
                    <TD key={`inp-${a}`} center>
                      <FInput value={dec.salespeopleAlloc?.[a]} disabled={disabled} min={0}
                        onChange={v => setAlloc(a, v)} />
                      <Err msg={errors.salespeopleAlloc?.[a]} />
                    </TD>
                  </>
                ))}
              </tr>
            </tbody></table>
            {errors.salespeopleAlloc?.length > AREA_LABELS.length && (
              <div style={{ color: 'red', fontSize: '0.8em' }}>
                {errors.salespeopleAlloc[errors.salespeopleAlloc.length - 1]}
              </div>
            )}
          </Section>

          {/* Salespeople Remuneration */}
          <Section title="Salespeople's Remuneration">
            <table><tbody>
              <tr>
                <TH>Quarterly Salary (£'00)</TH>
                <TD>
                  <FInput value={salaryDisplay} disabled={disabled} min={20}
                    onChange={v => set('salespersonSalary', Number(v) * 100)}
                    style={{ width: 64 }} />
                  <Err msg={errors.salespersonSalary} />
                </TD>
                <TH>% Sales Commission</TH>
                <TD>
                  <FInput value={dec.salesCommission} disabled={disabled} min={0} max={100}
                    onChange={v => set('salesCommission', v)} />
                  <Err msg={errors.salesCommission} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* Assembly wage + Shift level */}
          <Section>
            <table><tbody>
              <tr>
                <TH>Assembly Workers' hourly wage rate (£/hour)</TH>
                <TD>
                  <FInput value={dec.assemblyWage} disabled={disabled}
                    min={8.50} step={0.01} style={{ width: 72 }}
                    onChange={v => set('assemblyWage', v)} />
                  <Err msg={errors.assemblyWage} />
                </TD>
                <TH>Shift level</TH>
                <TD>
                  <select value={dec.shiftLevel || 1} disabled={disabled}
                    onChange={e => set('shiftLevel', parseInt(e.target.value))}
                    style={{ width: 44 }}>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                  <Err msg={errors.shiftLevel} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* Management Budget */}
          <Section>
            <table><tbody>
              <tr>
                <TH>Quarterly Management Budget (£'000)</TH>
                <TD>
                  <FInput value={budgetDisplay} disabled={disabled} min={40}
                    onChange={v => set('managementBudget', Number(v) * 1000)}
                    style={{ width: 64 }} />
                  <Err msg={errors.managementBudget} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* Contract Maintenance + Machines to Sell */}
          <Section>
            <table><tbody>
              <tr>
                <TH>Contract Maintenance hours</TH>
                <TD>
                  <FInput value={dec.contractMaintenance} disabled={disabled} min={0}
                    onChange={v => set('contractMaintenance', v)} />
                  <Err msg={errors.contractMaintenance} />
                </TD>
                <TH>Machines to Sell</TH>
                <TD>
                  <FInput value={dec.machinesToSell} disabled={disabled} min={0}
                    onChange={v => set('machinesToSell', v)} />
                  <Err msg={errors.machinesToSell} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

        </div>{/* end LEFT COLUMN */}

        {/* ════ RIGHT COLUMN ═══════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Dividend + Days Credit */}
          <Section>
            <table><tbody>
              <tr>
                <TH>Dividend Rate (pence/share)</TH>
                <TD>
                  <FInput value={dec.dividendRate} disabled={disabled || [2,4].includes(quarter)} min={0}
                    onChange={v => set('dividendRate', v)} />
                  <Err msg={errors.dividendRate} />
                  {[2,4].includes(quarter) && <span style={{ fontSize: '0.78em', color: '#777', marginLeft: 4 }}>Q1/Q3 only</span>}
                </TD>
                <TH>Days Credit Allowed</TH>
                <TD>
                  <FInput value={dec.daysCredit} disabled={disabled} min={0}
                    onChange={v => set('daysCredit', v)} />
                  <Err msg={errors.daysCredit} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* Vans */}
          <Section>
            <table><tbody>
              <tr>
                <TH>Vans to Buy</TH>
                <TD>
                  <FInput value={dec.vansToBuy} disabled={disabled} min={0}
                    onChange={v => set('vansToBuy', v)} />
                  <Err msg={errors.vansToBuy} />
                </TD>
                <TH>Vans to Sell</TH>
                <TD>
                  <FInput value={dec.vansToSell} disabled={disabled} min={0}
                    onChange={v => set('vansToSell', v)} />
                  <Err msg={errors.vansToSell} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* Information Wanted */}
          <Section title="Information Wanted">
            <FCheck label="on Other Companies (£5,000)"
              checked={dec.buyCompetitorInfo} disabled={disabled}
              onChange={v => set('buyCompetitorInfo', v)} />
            <FCheck label="on Market Shares (£5,000)"
              checked={dec.buyMarketShares} disabled={disabled}
              onChange={v => set('buyMarketShares', v)} />
          </Section>

          {/* Delivery Schedule */}
          <Section title="Make and Deliver Products to">
            <table><thead>
              <tr>
                <TH/>
                {PRODUCTS.map((_, p) => <TH key={p}>Product {p+1}</TH>)}
              </tr>
            </thead><tbody>
              {AREA_LABELS.map((area, a) => (
                <tr key={a}>
                  <TH>{area} Area</TH>
                  {PRODUCTS.map((_, p) => (
                    <TD key={p} center>
                      <FInput value={dec.deliverySchedule?.[p]?.[a]} disabled={disabled}
                        onChange={v => setDel(p, a, v)} style={{ width: 64 }} />
                      <Err msg={errors.deliverySchedule?.[p]?.[a]} />
                    </TD>
                  ))}
                </tr>
              ))}
            </tbody></table>
          </Section>

          {/* Research Expenditure */}
          <Section title="Research Expenditure (£'000)">
            <table><thead>
              <tr><TH/>{PRODUCTS.map((_, p) => <TH key={p}>Product {p+1}</TH>)}</tr>
            </thead><tbody>
              <tr>
                <TH/>
                {PRODUCTS.map((_, p) => (
                  <TD key={p} center>
                    <FInput value={resDisp(p)} disabled={disabled} min={0}
                      onChange={v => resSet(p, v)} />
                    <Err msg={resErr[p]} />
                  </TD>
                ))}
              </tr>
            </tbody></table>
          </Section>

          {/* Salespeople + Assembly Workers R/D/T */}
          <Section>
            <table><tbody>
              <tr>
                <TH>Salespeople</TH>
                <TH>Recruit</TH>
                <TD>
                  <FInput value={dec.salespeopleRecruit} disabled={disabled} min={0}
                    onChange={v => set('salespeopleRecruit', v)} />
                  <Err msg={errors.salespeopleRecruit} />
                </TD>
                <TH>Dismiss</TH>
                <TD>
                  <FInput value={dec.salespersonsDismiss} disabled={disabled} min={0}
                    onChange={v => set('salespersonsDismiss', v)} />
                  <Err msg={errors.salespersonsDismiss} />
                </TD>
                <TH>Train</TH>
                <TD>
                  <FInput value={dec.salespersonsTrain} disabled={disabled} min={0}
                    onChange={v => set('salespersonsTrain', v)} />
                  <Err msg={errors.salespersonsTrain} />
                </TD>
              </tr>
              <tr>
                <TH>Assembly Workers</TH>
                <TH>Recruit</TH>
                <TD>
                  <FInput value={dec.assemblyRecruit} disabled={disabled} min={0}
                    onChange={v => set('assemblyRecruit', v)} />
                  <Err msg={errors.assemblyRecruit} />
                </TD>
                <TH>Dismiss</TH>
                <TD>
                  <FInput value={dec.assemblyDismiss} disabled={disabled} min={0}
                    onChange={v => set('assemblyDismiss', v)} />
                  <Err msg={errors.assemblyDismiss} />
                </TD>
                <TH>Train</TH>
                <TD>
                  <FInput value={dec.assemblyTrain} disabled={disabled} min={0}
                    onChange={v => set('assemblyTrain', v)} />
                  <Err msg={errors.assemblyTrain} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* Raw Material */}
          <Section title="Raw Material">
            <table><tbody>
              <tr>
                <TH>Units to Order</TH>
                <TD>
                  <FInput value={dec.materialsQty} disabled={disabled} min={0}
                    onChange={v => set('materialsQty', v)} style={{ width: 72 }} />
                  <Err msg={errors.materialsQty} />
                </TD>
                <TH>Supplier No.</TH>
                <TD>
                  <select value={dec.materialsSupplier ?? 0} disabled={disabled}
                    onChange={e => set('materialsSupplier', parseInt(e.target.value))}
                    style={{ width: 44 }}>
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </TD>
                <TH>No. of Deliveries</TH>
                <TD>
                  <FInput value={dec.materialsDeliveries} disabled={disabled} min={0}
                    onChange={v => set('materialsDeliveries', v)} />
                  <Err msg={errors.materialsDeliveries} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

          {/* New Machines to Order */}
          <Section>
            <table><tbody>
              <tr>
                <TH>New Machines to Order</TH>
                <TD>
                  <FInput value={dec.machinesToOrder} disabled={disabled} min={0}
                    onChange={v => set('machinesToOrder', v)} />
                  <Err msg={errors.machinesToOrder} />
                </TD>
              </tr>
            </tbody></table>
          </Section>

        </div>{/* end RIGHT COLUMN */}
      </div>{/* end grid */}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      {!disabled && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={save}>Save</Button>
          <Button onClick={() => onNavigate('review')} disabled={hasErrors} variant={hasErrors ? 'secondary' : 'primary'}>
            Review &amp; Submit
          </Button>
          {saveMsg && (
            <span style={{ color: saveMsg.includes('failed') ? 'red' : 'green', fontSize: '0.88em' }}>
              {saveMsg}
            </span>
          )}
          {hasErrors && (
            <span style={{ color: 'red', fontSize: '0.85em' }}>
              Fix {Object.keys(errors).length} error(s) before submitting.
            </span>
          )}
          {!hasErrors && warnings.length > 0 && (
            <span style={{ color: '#b86000', fontSize: '0.85em' }}>
              {warnings.length} capacity warning(s) — review before submitting.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
