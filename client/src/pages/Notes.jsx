import { useEffect, useState } from 'react';
import api from '../api';

export default function Notes() {
  const [batches, setBatches] = useState([]);
  const [notes, setNotes] = useState(null);
  const [form, setForm] = useState({ batchId: '', title: '', body: '', qa: [{ q: '', a: '' }] });
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [error, setError] = useState('');
  const load = () => api('/notes').then(setNotes);
  useEffect(() => { load(); api('/batches').then((b) => { setBatches(b); if (b[0]) setForm((f) => ({ ...f, batchId: b[0].id })); }); }, []);

  const setQa = (i, key, val) => setForm({ ...form, qa: form.qa.map((x, j) => (j === i ? { ...x, [key]: val } : x)) });
  async function save(e) {
    e.preventDefault();
    try {
      await api('/notes', { method: 'POST', body: form });
      setForm({ ...form, title: '', body: '', qa: [{ q: '', a: '' }] }); setError(''); load();
    } catch (err) { setError(err.message); }
  }
  async function remove(n) { if (confirm(`Delete "${n.title}"?`)) { await api('/notes/' + n.id, { method: 'DELETE' }); load(); } }

  const by = { new: () => 0, az: (a, b) => a.title.localeCompare(b.title), studied: (a, b) => b.studied - a.studied };
  const shown = (notes || []).filter((n) => (n.title + n.batch).toLowerCase().includes(q.toLowerCase())).sort(by[sort]);

  return (
    <>
      <h1>Study notes</h1>
      <p className="muted">Notes appear in each student's study space. Add questions and answers so they can check themselves.</p>
      <form className="stack" onSubmit={save}>
        <div className="inline">
          <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <input placeholder="Title, e.g. Photosynthesis in plants" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <textarea rows="6" placeholder="Write the note" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        {form.qa.map((x, i) => (
          <div className="inline" key={i}>
            <input placeholder="Question" value={x.q} onChange={(e) => setQa(i, 'q', e.target.value)} />
            <input placeholder="Answer" value={x.a} onChange={(e) => setQa(i, 'a', e.target.value)} />
          </div>
        ))}
        <div className="inline">
          <button type="button" className="btn alt" onClick={() => setForm({ ...form, qa: [...form.qa, { q: '', a: '' }] })}>Add another question</button>
          <button className="btn">Publish note</button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="toolbar">
        <input type="search" placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Sort: Newest</option><option value="az">Sort: Title A–Z</option><option value="studied">Sort: Most studied</option>
        </select>
      </div>
      {!notes ? <div className="skel" style={{ height: 160 }} /> : shown.length === 0 ? <p className="empty">No notes match.</p> : (
        <div className="cards">
          {shown.map((n) => (
            <article className="card" key={n.id}>
              <h3>{n.title}</h3>
              <span className="muted">{n.batch} · {n.questions} questions</span>
              <div className="bar"><i style={{ width: (n.learners ? (100 * n.studied) / n.learners : 0) + '%' }} /></div>
              <span className="muted">{n.studied} of {n.learners} students studied</span>
              <button className="link" onClick={() => remove(n)}>Delete</button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
