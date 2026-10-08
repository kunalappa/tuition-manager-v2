import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';

export default function Study() {
  const { code } = useParams();
  const nav = useNavigate();
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    setData(null); setError(''); setOpen(null);
    if (code) api('/study/' + code).then(setData).catch((e) => setError(e.message));
  }, [code]);

  const notes = useMemo(() => {
    if (!data) return [];
    const by = { new: () => 0, az: (a, b) => a.title.localeCompare(b.title), todo: (a, b) => a.done - b.done };
    return data.notes
      .filter((n) => n.title.toLowerCase().includes(q.toLowerCase()) && (filter === 'all' || (filter === 'done') === n.done))
      .sort(by[sort]);
  }, [data, q, sort, filter]);

  async function view(n) { setOpen({ ...(await api(`/study/${code}/notes/${n.id}`)), done: n.done }); }
  async function toggle() {
    const done = !open.done;
    await api(`/study/${code}/notes/${open.id}/done`, { method: 'POST', body: { done } });
    setOpen({ ...open, done });
    setData({ ...data, notes: data.notes.map((n) => (n.id === open.id ? { ...n, done } : n)) });
  }

  if (!code) return (
    <div className="parent">
      <h1>Your study space</h1>
      <p className="muted">Enter the access code your tutor gave you.</p>
      <form className="inline" onSubmit={(e) => { e.preventDefault(); nav('/study/' + input.trim()); }}>
        <input placeholder="Access code" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn">Open</button>
      </form>
      <Link to="/login">Tutor sign in</Link>
    </div>
  );
  if (error) return <div className="parent"><p className="error">{error}</p><Link to="/study">Try another code</Link></div>;
  if (!data) return <div className="parent"><div className="skel" style={{ height: 220 }} /></div>;

  const done = data.notes.filter((n) => n.done).length;
  const pct = data.notes.length ? Math.round((100 * done) / data.notes.length) : 0;

  if (open) return (
    <div className="parent">
      <button className="back" onClick={() => setOpen(null)}>← All notes</button>
      <h1>{open.title}</h1>
      <p className="note-body">{open.body}</p>
      {open.qa.length > 0 && <><h2>Check yourself</h2>
        {open.qa.map((x, i) => <details className="qa" key={i}><summary>{x.q}</summary><p>{x.a}</p></details>)}</>}
      <button className="btn" onClick={toggle}>{open.done ? 'Studied – undo' : 'Mark as studied'}</button>
    </div>
  );

  return (
    <div className="parent wide">
      <h1>Hi {data.name.split(' ')[0]}</h1>
      <p className="muted">{data.batch}</p>
      <div className="stat">
        <b>{pct}%</b>of your notes studied ({done} of {data.notes.length})
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
      </div>
      <div className="toolbar">
        <input type="search" placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest first</option><option value="az">Title A–Z</option><option value="todo">Not studied first</option>
        </select>
        <div className="chips">{['all', 'todo', 'done'].map((f) => <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{{ all: 'All', todo: 'To study', done: 'Studied' }[f]}</button>)}</div>
      </div>
      {data.notes.length === 0 && <p className="empty">Your tutor hasn't added notes yet. Check back soon.</p>}
      <div className="cards">
        {notes.map((n) => (
          <article className="card clickable" key={n.id} onClick={() => view(n)}>
            <h3>{n.title}</h3>
            <p>{n.preview}…</p>
            <span className="muted">{n.questions} practice questions</span>
            <span className={'pill ' + (n.done ? 'paid' : 'pending')}>{n.done ? 'Studied' : 'To study'}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
