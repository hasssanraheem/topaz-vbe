import { useState } from 'react';
import DecisionPanel from '../components/DecisionPanel.jsx';
import NumberField from '../components/NumberField.jsx';
import SelectField from '../components/SelectField.jsx';
import Button from '../components/Button.jsx';
import { AREAS, PRODUCTS, SHIFT_HOURS } from '../data/mockData.js';
import { validateDeliverySchedule, validateShiftLevel, validateAssemblyTimes,
         validateContractMaintenance, validateMachinesToSell, validateMachinesToOrder,
         validateMaterialsQty, validateMaterialsDeliveries } from '../logic/validation.js';
import { calcMachineHoursRequired, calcMachineHoursAvailable,
         calcAssemblyHoursRequired, calcAssemblyHoursAvailable } from '../logic/calculations.js';
import { saveDecisions } from '../logic/storage.js';

export default function ProductionPage({ dec, onChange, period, disabled, periodData }) {
  const [saveMsg, setSaveMsg] = useState('');
  const machines = periodData?.resources?.machinesAvailable || 6;
  const assemblyWorkers = periodData?.resources?.personnel?.assemblyWorkers?.nextQtr || 40;

  const delE = validateDeliverySchedule(dec.deliverySchedule);
  const shiftE = validateShiftLevel(dec.shiftLevel);
  const asmE = validateAssemblyTimes(dec.assemblyTimes);
  const maintE = validateContractMaintenance(dec.contractMaintenance);
  const mSellE = validateMachinesToSell(dec.machinesToSell, machines);
  const mOrdE = validateMachinesToOrder(dec.machinesToOrder);
  const matQtyE = validateMaterialsQty(dec.materialsQty);
  const matDelE = validateMaterialsDeliveries(dec.materialsDeliveries);

  const mHrsReq = calcMachineHoursRequired(dec.deliverySchedule, dec.assemblyTimes);
  const mHrsAvail = calcMachineHoursAvailable(machines, parseInt(dec.shiftLevel) || 1);
  const aHrsReq = calcAssemblyHoursRequired(dec.deliverySchedule, dec.assemblyTimes);
  const aHrsAvail = calcAssemblyHoursAvailable(assemblyWorkers);
  const machineOver = mHrsReq > mHrsAvail;
  const assemblyOver = aHrsReq > aHrsAvail;

  function setDel(p, a, val) {
    const s = dec.deliverySchedule.map(r => [...r]);
    s[p][a] = val;
    onChange({ ...dec, deliverySchedule: s });
  }

  function setAsmTime(p, val) {
    const t = [...dec.assemblyTimes];
    t[p] = val;
    onChange({ ...dec, assemblyTimes: t });
  }

  function save() {
    if (saveDecisions(period, dec)) setSaveMsg('Decisions saved.');
    else setSaveMsg('Save failed.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  return (
    <div>
      <h2>Production Decisions</h2>
      {disabled && <div className="locked-notice">This period has been submitted. Decisions are read-only.</div>}

      {/* Capacity summary */}
      <div className={`capacity-bar${machineOver ? ' over' : ''}`}>
        Machine hours: required <strong>{mHrsReq.toLocaleString('en-GB')}</strong> / available <strong>{mHrsAvail.toLocaleString('en-GB')}</strong>
        {machineOver && <span style={{ marginLeft: 8 }}>&#9888; Exceeds capacity — production will be reduced</span>}
      </div>
      <div className={`capacity-bar${assemblyOver ? ' over' : ''}`}>
        Assembly hours: required <strong>{aHrsReq.toLocaleString('en-GB')}</strong> / available <strong>{aHrsAvail.toLocaleString('en-GB')}</strong>
        {assemblyOver && <span style={{ marginLeft: 8 }}>&#9888; Exceeds capacity — production will be reduced</span>}
      </div>

      {/* Delivery Schedule */}
      <DecisionPanel title="Product Delivery Schedule (units per area)">
        <p style={{ fontSize: '0.82em', marginBottom: 6 }}>
          Enter planned deliveries per product per area. Negative values transfer stock from that area to others.
        </p>
        <table className="grid-table">
          <thead>
            <tr><th>Product</th>{AREAS.map(a => <th key={a}>{a}</th>)}<th>Total</th></tr>
          </thead>
          <tbody>
            {PRODUCTS.map((prod, p) => {
              const rowTotal = dec.deliverySchedule[p].reduce((s, v) => s + (parseInt(v) || 0), 0);
              return (
                <tr key={p}>
                  <td className="label-cell">{prod}</td>
                  {AREAS.map((_, a) => (
                    <td key={a}>
                      <input type="number" step="1" disabled={disabled}
                        value={dec.deliverySchedule[p][a]}
                        onChange={e => setDel(p, a, e.target.value)} />
                      {delE[p]?.[a] && <div style={{ color: 'red', fontSize: '0.8em' }}>{delE[p][a]}</div>}
                    </td>
                  ))}
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>{rowTotal.toLocaleString('en-GB')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DecisionPanel>

      {/* Shift and Assembly */}
      <DecisionPanel title="Shift Level and Assembly Times">
        <SelectField label="Shift Level" value={String(dec.shiftLevel)}
          onChange={v => onChange({ ...dec, shiftLevel: parseInt(v) })}
          options={[
            { value: '1', label: '1 — Single (576 hrs/machine, 4 machinists)' },
            { value: '2', label: '2 — Double (1,068 hrs/machine, 8 machinists)' },
            { value: '3', label: '3 — Triple (1,602 hrs/machine, 12 machinists)' },
          ]}
          error={shiftE} disabled={disabled} />
        <p style={{ fontSize: '0.82em', margin: '8px 0 4px' }}>Assembly Times (minutes per unit — minimum from Table 3)</p>
        {PRODUCTS.map((prod, p) => (
          <NumberField key={p} label={`${prod} — Assembly Time`}
            value={dec.assemblyTimes[p]} unit="min"
            onChange={v => setAsmTime(p, v)}
            error={asmE[p]} disabled={disabled} min={[100,150,300][p]} />
        ))}
      </DecisionPanel>

      {/* Maintenance and Machines */}
      <DecisionPanel title="Maintenance and Machines">
        <NumberField label="Contract Maintenance Hours (per machine)"
          value={dec.contractMaintenance} unit="hrs"
          onChange={v => onChange({ ...dec, contractMaintenance: v })}
          error={maintE} disabled={disabled} min={0} />
        <p style={{ fontSize: '0.8em', color: '#555', marginBottom: 4 }}>
          Contracted: £60/hr per machine. Uncontracted repairs: £120/hr.
        </p>
        <NumberField label="Machines to Sell"
          value={dec.machinesToSell}
          onChange={v => onChange({ ...dec, machinesToSell: v })}
          error={mSellE} disabled={disabled} min={0} />
        <NumberField label="Machines to Order"
          value={dec.machinesToOrder}
          onChange={v => onChange({ ...dec, machinesToOrder: v })}
          error={mOrdE} disabled={disabled} min={0} />
        <p style={{ fontSize: '0.8em', color: '#555' }}>
          Machines cost £200,000. 50% deposit next quarter; 50% on installation (quarter after). Available from the third quarter.
        </p>
        <p style={{ fontSize: '0.8em', color: '#555' }}>
          Machines currently available: <strong>{machines}</strong>
        </p>
      </DecisionPanel>

      {/* Materials */}
      <DecisionPanel title="Materials to Order">
        <NumberField label="Quantity"
          value={dec.materialsQty} unit="units"
          onChange={v => onChange({ ...dec, materialsQty: v })}
          error={matQtyE} disabled={disabled} min={0} />
        <SelectField label="Supplier"
          value={String(dec.materialsSupplier)}
          onChange={v => onChange({ ...dec, materialsSupplier: parseInt(v) })}
          options={[
            { value: '0', label: '0 — No discount, no delivery charge, JIT' },
            { value: '1', label: '1 — 10% discount, £200 delivery, min 1 unit' },
            { value: '2', label: '2 — 15% discount, £300 delivery, min 10,000 units' },
            { value: '3', label: '3 — 30% discount, £100 delivery, 12 weekly deliveries, min 50,000 units' },
          ]}
          disabled={disabled} />
        <NumberField label="Number of Deliveries"
          value={dec.materialsDeliveries} unit="(0 = JIT/weekly)"
          onChange={v => onChange({ ...dec, materialsDeliveries: v })}
          error={matDelE} disabled={disabled} min={0} />
        <p style={{ fontSize: '0.8em', color: '#555', marginTop: 4 }}>
          Factory material storage: 2,000 units. Excess stored externally at £1.50/unit.
          Material price next quarter: <strong>£{(periodData?.economy?.materialPriceNext || periodData?.accounts?.materialPriceNext || 12000).toLocaleString('en-GB')}</strong> per 1,000 units.
        </p>
      </DecisionPanel>

      {!disabled && (
        <div style={{ marginTop: 8 }}>
          <Button onClick={save}>Save Decisions</Button>
          {saveMsg && <span style={{ marginLeft: 12, color: saveMsg.includes('failed') ? 'red' : 'green', fontSize: '0.88em' }}>{saveMsg}</span>}
        </div>
      )}
    </div>
  );
}
