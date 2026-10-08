import { useEffect, useState } from 'react';
import api from '../api';

export default function Students() {
  const [list, setList] = useState(null);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ name: '', batchId: '', parentName: '', parentPhone: '' });
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('name');
  const load = () => api('/students').then(setList);
  useEffect(() => { load(); api('/batches').then(setBatches); }, []);

  async function add(e) {
    e.preventDefault();
    try { await api('/students', { method: 'POST', body: form }); setForm({ ...form, name: '', parentName: '', parentPhone: '' }); setError(''); load(); }
    catch (err) { setError(err.message); }
  }
  async function remove(s) {
    if (confirm(`Remove ${s.name}? Their attendance and fee history will be deleted.`)) { await api('/students/' + s.id, { method: 'DELETE' }); load(); }
  }

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name),
    attendance: (a, b) => (b.attendance ?? -1) - (a.attendance ?? -1),
    progress: (a, b) => b.studied - a.studied,
  };
  const shown = (list || []).filter((s) => (s.name + s.batch).toLowerCase().includes(q.toLowerCase())).sort(sorters[sort]);

  return (
    <>
      <h1>Students</h1>
      <form className="inline" onSubmit={add}>
        <input placeholder="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
          <option value="">Batch</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input placeholder="Parent name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
        <input placeholder="Parent phone" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
        <button className="btn">Add student</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="toolbar">
        <input type="search" placeholder="Search by name or batch" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Sort: Name</option><option value="attendance">Sort: Attendance</option><option value="progress">Sort: Notes studied</option>
        </select>
        <span className="muted">{shown.length} students</span>
      </div>
      {!list ? <div className="skel" style={{ height: 240 }} /> : (
        <table>
          <thead><tr><th>Name</th><th>Batch</th><th>Parent</th><th>Attendance</th><th>Notes studied</th><th>Access code</th><th /></tr></thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.batch}</td><td>{s.parent_name}<span className="muted">{s.parent_phone}</span></td>
                <td>{s.attendance ?? '–'}%</td><td>{s.studied}/{s.total_notes}</td><td><code>{s.parent_code}</code></td>
                <td><button className="link" onClick={() => remove(s)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
