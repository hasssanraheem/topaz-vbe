import { useState } from 'react';
import Button from '../components/Button.jsx';
import Message from '../components/Message.jsx';

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ teamName: '', companyNumber: '', groupNumber: '1', accessCode: '' });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  function validate() {
    const e = {};
    if (!form.teamName.trim()) e.teamName = 'Team name is required';
    else if (form.teamName.trim().length > 50) e.teamName = 'Maximum 50 characters';
    if (!form.companyNumber.trim()) e.companyNumber = 'Company number is required';
    if (!form.groupNumber.trim()) e.groupNumber = 'Group number is required';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onLogin({
      teamName: form.teamName.trim(),
      companyNumber: form.companyNumber.trim(),
      groupNumber: form.groupNumber.trim(),
    });
  }

  return (
    <div style={{ padding: '2em 3%' }}>
      <div className="login-wrap">
        <h2>Topaz-Vbe — Team Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label">Team Name</label>
            <input className="field-input wide text-left" value={form.teamName}
              onChange={e => set('teamName', e.target.value)} maxLength={50} />
          </div>
          {errors.teamName && <span className="field-error">{errors.teamName}</span>}

          <div className="field-row">
            <label className="field-label">Company Number</label>
            <input className="field-input text-left" value={form.companyNumber}
              onChange={e => set('companyNumber', e.target.value)} />
          </div>
          {errors.companyNumber && <span className="field-error">{errors.companyNumber}</span>}

          <div className="field-row">
            <label className="field-label">Group Number</label>
            <input className="field-input text-left" value={form.groupNumber}
              onChange={e => set('groupNumber', e.target.value)} />
          </div>
          {errors.groupNumber && <span className="field-error">{errors.groupNumber}</span>}

          <div className="field-row">
            <label className="field-label">Demo Access Code</label>
            <input className="field-input text-left" type="text" value={form.accessCode}
              onChange={e => set('accessCode', e.target.value)} />
          </div>
          <span className="login-note">Demo-only field — any value accepted. Not a real authentication system.</span>

          <div style={{ marginTop: '14px' }}>
            <Button type="submit">Enter Simulation</Button>
          </div>
        </form>
      </div>
      <div style={{ maxWidth: 420, margin: '1em auto' }}>
        <Message type="info">
          <strong>Demonstration prototype.</strong> This is an educational replica of Topaz-Vbe.
          It is not affiliated with Edit 515 Ltd. All data is mock data.
        </Message>
      </div>
    </div>
  );
}
