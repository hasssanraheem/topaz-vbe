import { useState } from 'react';
import DecisionPanel from '../components/DecisionPanel.jsx';
import NumberField from '../components/NumberField.jsx';
import DecimalField from '../components/DecimalField.jsx';
import DataTable from '../components/DataTable.jsx';
import Button from '../components/Button.jsx';
import { validateRecruit, validateDismiss, validateTrain, validateAssemblyWage } from '../logic/validation.js';
import { saveDecisions } from '../logic/storage.js';

export default function PersonnelPage({ dec, onChange, period, disabled, periodData }) {
  const [saveMsg, setSaveMsg] = useState('');

  const pers = periodData?.resources?.personnel || {};
  const currentSalespeople = pers.salespeople?.start || 6;
  const currentAssembly = pers.assemblyWorkers?.start || 40;
  const prevWage = periodData?.decisions?.assemblyWage || 8.50;

  const spRecE = validateRecruit(dec.salespeopleRecruit);
  const spDisE = validateDismiss(dec.salespersonsDismiss, currentSalespeople);
  const spTraE = validateTrain(dec.salespersonsTrain);
  const awRecE = validateRecruit(dec.assemblyRecruit);
  const awDisE = validateDismiss(dec.assemblyDismiss, currentAssembly);
  const awTraE = validateTrain(dec.assemblyTrain);
  const wageE = validateAssemblyWage(dec.assemblyWage, prevWage);

  function save() {
    if (saveDecisions(period, dec)) setSaveMsg('Decisions saved.');
    else setSaveMsg('Save failed.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  const persRows = [
    { cells: ['', 'Salespeople', 'Assembly Workers', 'Machinists'] },
    { cells: ['At start of quarter', pers.salespeople?.start ?? '—', pers.assemblyWorkers?.start ?? '—', pers.machinists?.start ?? '—'] },
    { cells: ['Recruited', pers.salespeople?.recruited ?? '—', pers.assemblyWorkers?.recruited ?? '—', pers.machinists?.recruited ?? '—'] },
    { cells: ['Trained', pers.salespeople?.trained ?? '—', pers.assemblyWorkers?.trained ?? '—', '—'] },
    { cells: ['Dismissed', pers.salespeople?.dismissed ?? '—', pers.assemblyWorkers?.dismissed ?? '—', pers.machinists?.dismissed ?? '—'] },
    { cells: ['Leavers', pers.salespeople?.leavers ?? '—', pers.assemblyWorkers?.leavers ?? '—', pers.machinists?.leavers ?? '—'] },
    { cells: ['Available next quarter', pers.salespeople?.nextQtr ?? '—', pers.assemblyWorkers?.nextQtr ?? '—', pers.machinists?.nextQtr ?? '—'] },
  ];

  return (
    <div>
      <h2>Personnel Decisions</h2>
      {disabled && <div className="locked-notice">This period has been submitted. Decisions are read-only.</div>}

      <DecisionPanel title="Last Period — Personnel Summary">
        <DataTable
          headers={['', 'Salespeople', 'Assembly Workers', 'Machinists']}
          rows={persRows.slice(1)}
        />
        <p style={{ fontSize: '0.8em', color: '#555' }}>
          Machinists are managed automatically (4 per machine per shift). No senior management decision required.
        </p>
      </DecisionPanel>

      <DecisionPanel title="Salespeople — Recruit / Dismiss / Train">
        <p style={{ fontSize: '0.85em', marginBottom: 6 }}>
          Current salespeople: <strong>{currentSalespeople}</strong>.
          Recruitment costs £1,500; dismissal £5,000; training £6,000 per person.
        </p>
        <NumberField label="Recruit" value={dec.salespeopleRecruit} unit="people"
          onChange={v => onChange({ ...dec, salespeopleRecruit: v })} error={spRecE} disabled={disabled} min={0} />
        <NumberField label="Dismiss" value={dec.salespersonsDismiss} unit="people"
          onChange={v => onChange({ ...dec, salespersonsDismiss: v })} error={spDisE} disabled={disabled} min={0} />
        <NumberField label="Train (from unemployed pool)" value={dec.salespersonsTrain} unit="people"
          onChange={v => onChange({ ...dec, salespersonsTrain: v })} error={spTraE} disabled={disabled} min={0} />
        <p style={{ fontSize: '0.8em', color: '#555' }}>
          Note: recruitment success depends on labour market conditions. Trained staff are guaranteed for at least one quarter.
        </p>
      </DecisionPanel>

      <DecisionPanel title="Assembly Workers — Recruit / Dismiss / Train">
        <p style={{ fontSize: '0.85em', marginBottom: 6 }}>
          Current assembly workers: <strong>{currentAssembly}</strong>.
          Recruitment costs £1,200; dismissal £3,000; training £4,500 per worker.
        </p>
        <NumberField label="Recruit" value={dec.assemblyRecruit} unit="workers"
          onChange={v => onChange({ ...dec, assemblyRecruit: v })} error={awRecE} disabled={disabled} min={0} />
        <NumberField label="Dismiss" value={dec.assemblyDismiss} unit="workers"
          onChange={v => onChange({ ...dec, assemblyDismiss: v })} error={awDisE} disabled={disabled} min={0} />
        <NumberField label="Train (from unemployed pool)" value={dec.assemblyTrain} unit="workers"
          onChange={v => onChange({ ...dec, assemblyTrain: v })} error={awTraE} disabled={disabled} min={0} />
      </DecisionPanel>

      <DecisionPanel title="Pay and Conditions">
        <DecimalField label="Assembly Workers' Hourly Wage Rate" value={dec.assemblyWage}
          unit="£/hour" onChange={v => onChange({ ...dec, assemblyWage: v })}
          error={wageE} disabled={disabled} min={8.50} step={0.10} />
        <p style={{ fontSize: '0.8em', color: '#555', marginTop: 4 }}>
          Minimum rate: £8.50/hour. Rate cannot be reduced below the previous quarter's rate.
          Previous quarter rate: £{Number(prevWage).toFixed(2)}/hour.
        </p>
        <p style={{ fontSize: '0.8em', color: '#555' }}>
          Salesperson's salary and commission are set on the Marketing page.
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
