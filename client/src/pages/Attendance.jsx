import { useEffect, useState } from 'react';
import api from '../api';

const today = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => { api('/batches').then((b) => { setBatches(b); if (b[0]) setBatchId(b[0].id); }); }, []);
  useEffect(() => {
    if (batchId) api(`/attendance?batchId=${batchId}&date=${date}`).then((r) => setRows(r.map((x) => ({ ...x, status: x.status || 'present' }))));
    setMsg('');
  }, [batchId, date]);

  const set = (id, status) => setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)));
  async function save() {
    const res = await api('/attendance', { method: 'POST', body: { date, records: rows.map((r) => ({ studentId: r.id, status: r.status })) } });
    setMsg(`Saved attendance for ${res.saved} students.`);
  }

  return (
    <>
      <h1>Attendance</h1>
      <div className="inline">
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
        <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
      </div>
      {rows.length === 0 && <p className="empty">No students in this batch yet.</p>}
      {rows.map((r) => (
        <div className="row" key={r.id}>
          <strong>{r.name}</strong>
          <div className="seg">
            {['present', 'late', 'absent'].map((s) => (
              <button key={s} className={r.status === s ? 'on ' + s : ''} onClick={() => set(r.id, s)}>{s[0].toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
      ))}
      {rows.length > 0 && <div className="inline"><button className="btn" onClick={save}>Save attendance</button><span className="muted">{msg}</span></div>}
    </>
  );
}
