import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../api';

export default function Parent() {
  const { code } = useParams();
  const nav = useNavigate();
  const [input, setInput] = useState('');
  const [kid, setKid] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) api('/parent/' + code).then(setKid).catch((e) => setError(e.message));
    else setKid(null);
  }, [code]);

  if (!code) return (
    <div className="parent">
      <h1>Your child's progress</h1>
      <form className="inline" onSubmit={(e) => { e.preventDefault(); nav('/parent/' + input.trim()); }}>
        <input placeholder="Enter the code from the tutor" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn">View progress</button>
      </form>
      <Link to="/login">Tutor sign in</Link>
    </div>
  );
  if (error) return <div className="parent"><p className="error">{error}</p><Link to="/parent">Try another code</Link></div>;
  if (!kid) return <div className="parent"><div className="skel" style={{ height: 200 }} /></div>;

  return (
    <div className="parent">
      <h1>{kid.name}</h1>
      <p className="muted">{kid.batch} with {kid.tutor}</p>
      <div className="stats">
        <div className="stat"><b>{kid.attendance ?? '–'}%</b>attendance, last {kid.recent.length} classes</div>
      </div>
      <h2>Recent classes</h2>
      <div className="dots">{kid.recent.map((r) => <span key={r.class_date} className={'dot ' + r.status} title={`${r.class_date}: ${r.status}`} />)}</div>
      <h2>Fees</h2>
      {kid.fees.map((f) => <div className="row" key={f.month}><span>{f.month}</span><span className={'pill ' + f.status}>{f.status}</span></div>)}
    </div>
  );
}
