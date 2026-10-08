import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: 'demo@tutor.com', password: 'demo1234' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      const d = await api('/auth/login', { method: 'POST', body: form });
      localStorage.setItem('token', d.token);
      localStorage.setItem('name', d.name);
      nav('/');
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <h1>Your classroom,<br />sorted.</h1>
        <p>Keep attendance and fees in order, share study notes with every batch, and see how each student is progressing.</p>
      </section>
      <form className="auth-form" onSubmit={submit}>
        <h2>Sign in</h2>
        <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Sign in</button>
        <Link to="/study">Student? Open your study space</Link>
        <Link to="/parent">Parent? Check your child's progress</Link>
      </form>
    </div>
  );
}
