import { useEffect, useState } from 'react';
import api from '../api';

export default function Fees() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [show, setShow] = useState('all');
  const load = () => api('/fees?month=' + month).then(setRows);
  useEffect(() => { setRows(null); load(); }, [month]);

  const pay = async (id) => { await api(`/fees/${id}/pay`, { method: 'PATCH' }); load(); };

  return (
    <>
      <h1>Fees</h1>
      <div className="toolbar">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <input type="search" placeholder="Search student" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={show} onChange={(e) => setShow(e.target.value)}>
          <option value="all">All fees</option><option value="pending">Pending only</option><option value="paid">Paid only</option>
        </select>
      </div>
      {!rows ? <div className="skel" style={{ height: 200 }} /> : rows.length === 0 ? <p className="empty">No fee records for this month.</p> : (
        <table>
          <thead><tr><th>Student</th><th>Batch</th><th>Amount</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.filter((f) => (show === 'all' || f.status === show) && f.name.toLowerCase().includes(q.toLowerCase())).map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td><td>{f.batch}</td><td>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                <td><span className={'pill ' + f.status}>{f.status === 'paid' ? 'Paid ' + f.paid_on : 'Pending'}</span></td>
                <td>{f.status === 'pending' && <button className="btn small" onClick={() => pay(f.id)}>Mark paid</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
