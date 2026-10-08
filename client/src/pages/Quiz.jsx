import { useEffect, useState } from 'react';
import api from '../api';

export default function Quiz() {
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ batchId: '', title: '', text: '' });
  const [qs, setQs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api('/batches').then((b) => { setBatches(b); if (b[0]) setForm((f) => ({ ...f, batchId: b[0].id })); }); }, []);

  async function run(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { setQs((await api('/quiz', { method: 'POST', body: form })).questions); }
    catch (err) { setError(err.message); }
    setBusy(false);
  }

  return (
    <>
      <h1>Quiz maker</h1>
      <p className="muted">Paste a chapter and get practice questions with answers.</p>
      <form className="stack" onSubmit={run}>
        <div className="inline">
          <select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <input placeholder="Paper title, e.g. Trigonometry – Practice 1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <textarea rows="8" placeholder="Paste the chapter text here" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <button className="btn" disabled={busy}>{busy ? 'Writing questions…' : 'Generate questions'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {qs && <ol className="paper">{qs.map((q, i) => (
        <li key={i}><p>{q.q}</p>
          {q.options && <ul>{q.options.map((o, j) => <li key={j}>{o}</li>)}</ul>}
          <details><summary>Answer</summary>{q.answer}</details></li>
      ))}</ol>}
    </>
  );
}
