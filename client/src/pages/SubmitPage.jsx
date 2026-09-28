import { useState } from 'react';
import Button from '../components/Button.jsx';
import Message from '../components/Message.jsx';
import DataTable from '../components/DataTable.jsx';
import { validateAll } from '../logic/validation.js';
import { markSubmitted, isSubmitted } from '../logic/storage.js';

export default function SubmitPage({ dec, period, periodData, submitted, onSubmitted, onNavigate }) {
  const [step, setStep] = useState('pre'); // pre | confirm | done
  const [submitError, setSubmitError] = useState('');

  const context = {
    machines: periodData?.resources?.machinesAvailable || 6,
    assemblyWorkers: periodData?.resources?.personnel?.assemblyWorkers?.nextQtr || 40,
    salespeople: periodData?.resources?.personnel?.salespeople?.nextQtr || 6,
    reserves: periodData?.accounts?.reserves || 0,
    prevAssemblyWage: periodData?.decisions?.assemblyWage || 8.50,
    vehicles: periodData?.resources?.vehiclesAvailable || 4,
    quarter: ((period - 1) % 4) + 1,
  };

  const { valid, errors, warnings } = validateAll(dec, context);
  const submitTime = new Date().toLocaleString('en-GB');

  function handleConfirm() {
    if (!valid) {
      setSubmitError('Cannot submit: there are validation errors. Please review and fix before submitting.');
      return;
    }
    setStep('confirm');
  }

  function handleFinalSubmit() {
    const success = markSubmitted(period, { submittedAt: new Date().toISOString() });
    if (success) {
      setStep('done');
      onSubmitted();
    } else {
      setSubmitError('Submission failed — could not save to localStorage. Please try again.');
    }
  }

  if (submitted && step !== 'done') {
    return (
      <div>
        <h2>Submit Decisions — Period {period}</h2>
        <div className="locked-notice">Period {period} has already been submitted.</div>
        <Message type="info">
          Your decisions for Period {period} have been submitted and are awaiting processing by the simulation administrator.
          You may still view all reports, but decisions are locked.
        </Message>
        <Button onClick={() => onNavigate('reports', 'decisions-made')}>View Submitted Decisions</Button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div>
        <h2>Submission Complete — Period {period}</h2>
        <Message type="info">
          <strong>Period {period} decisions submitted successfully.</strong><br />
          Your decisions have been locked and are now awaiting processing by the simulation administrator.<br />
          Status: <strong>Awaiting Processing</strong>
        </Message>
        <DataTable headers={['Item', 'Value']} rows={[
          { cells: ['Period', period] },
          { cells: ['Status', 'Awaiting Processing'] },
          { cells: ['Submitted At', submitTime] },
        ]} />
        <p style={{ marginTop: 12 }}>
          You may now view all reports for Period {period}. Decisions are locked and read-only.
        </p>
        <Button onClick={() => onNavigate('reports', 'decisions-made')}>View Reports</Button>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div>
        <h2>Confirm Submission — Period {period}</h2>
        <Message type="warning">
          <strong>You are about to submit your decisions for Period {period}.</strong><br />
          Once submitted, your decisions will be locked and cannot be changed.<br />
          Please confirm you are happy to proceed.
        </Message>
        {warnings.length > 0 && (
          <div className="review-warning-list" style={{ marginBottom: 12 }}>
            <strong>Warnings (submission is still allowed):</strong>
            <ul>
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <Button onClick={handleFinalSubmit}>Confirm and Submit</Button>
          <Button variant="secondary" onClick={() => setStep('pre')}>Go Back</Button>
        </div>
        {submitError && <Message type="error">{submitError}</Message>}
      </div>
    );
  }

  return (
    <div>
      <h2>Submit Decisions — Period {period}</h2>
      <p>
        Submitting will lock all decisions for Period {period}. You will not be able to make any further changes.
        The simulation administrator will then process the results.
      </p>

      {!valid && (
        <Message type="error">
          <strong>Cannot submit:</strong> There are {Object.keys(errors).length} validation error(s).
          Please go back and fix them before submitting.
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            {Object.entries(errors).slice(0, 5).map(([k, v]) => <li key={k}>{k}: {v}</li>)}
            {Object.keys(errors).length > 5 && <li>…and {Object.keys(errors).length - 5} more.</li>}
          </ul>
        </Message>
      )}

      {valid && (
        <Message type="info">
          All decisions are valid. {warnings.length > 0
            ? `${warnings.length} warning(s) noted — you may still submit.`
            : 'Ready to submit.'}
        </Message>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <Button onClick={handleConfirm} disabled={!valid}>Review and Confirm</Button>
        <Button variant="secondary" onClick={() => onNavigate('review')}>Review Decisions</Button>
      </div>
      {submitError && <Message type="error">{submitError}</Message>}
    </div>
  );
}
