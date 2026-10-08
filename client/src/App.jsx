import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Attendance from './pages/Attendance.jsx';
import Fees from './pages/Fees.jsx';
import Quiz from './pages/Quiz.jsx';
import Parent from './pages/Parent.jsx';
import Notes from './pages/Notes.jsx';
import Study from './pages/Study.jsx';

function Shell() {
  const nav = useNavigate();
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />;
  const out = () => { localStorage.clear(); nav('/login'); };
  return (
    <div className="shell">
      <aside>
        <div className="brand">Tuition<br />Manager</div>
        <nav>
          {[['/', 'Overview'], ['/students', 'Students'], ['/attendance', 'Attendance'], ['/fees', 'Fees'], ['/notes', 'Notes'], ['/quiz', 'Quiz maker']].map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
        <div className="who">{localStorage.getItem('name')}<button onClick={out}>Sign out</button></div>
      </aside>
      <main><Outlet /></main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/parent" element={<Parent />} />
      <Route path="/parent/:code" element={<Parent />} />
      <Route path="/study" element={<Study />} />
      <Route path="/study/:code" element={<Study />} />
      <Route element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="notes" element={<Notes />} />
        <Route path="quiz" element={<Quiz />} />
      </Route>
    </Routes>
  );
}
