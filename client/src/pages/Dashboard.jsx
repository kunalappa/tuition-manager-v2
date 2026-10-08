import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api('/dashboard').then(setD); }, []);
  if (!d) return <div className="skel" style={{ height: 220 }} />;
  return (
    <>
      <h1>Good to see you, {localStorage.getItem('name')?.split(' ')[0]}</h1>
      <div className="inline">
        <Link className="btn" to="/attendance">Take attendance</Link>
        <Link className="btn alt" to="/notes">Add a study note</Link>
      </div>
      <div className="stats">
        <div className="stat"><b>{d.students}</b>students enrolled</div>
        <div className="stat"><b>{rupees(d.collected)}</b>collected this month</div>
        <div className="stat warn"><b>{rupees(d.pending)}</b>still pending</div>
        <div className="stat"><b>{d.notes}</b>study notes shared</div>
      </div>
      <div className="two">
        <section>
          <h2>Your batches</h2>
          {d.batches.map((b) => (
            <div className="row" key={b.id}>
              <div><strong>{b.name}</strong><span className="muted">{b.schedule} · {b.students} students</span></div>
              <div className="meter"><i style={{ width: (b.attendance ?? 0) + '%' }} /><span>{b.attendance ?? '–'}% attendance</span></div>
            </div>
          ))}
        </section>
        <section>
          <h2>Fees to follow up</h2>
          {d.owing.length === 0 && <p className="empty">Everyone has paid this month.</p>}
          {d.owing.map((o) => (
            <div className="row" key={o.name}><div><strong>{o.name}</strong><span className="muted">{o.batch}</span></div><span>{rupees(o.amount)}</span></div>
          ))}
          <Link to="/fees">See all fees</Link>
        </section>
      </div>
    </>
  );
}
