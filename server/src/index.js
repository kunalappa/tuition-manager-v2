require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));

// Public: parents look up a child's progress with the code the tutor shares
app.get('/api/parent/:code', async (req, res) => {
  const [[kid]] = await db.query(
    `SELECT st.id, st.name, b.name batch, b.subject, t.name tutor FROM students st
     JOIN batches b ON b.id = st.batch_id JOIN tutors t ON t.id = b.tutor_id WHERE st.parent_code = ?`,
    [req.params.code.toUpperCase()]);
  if (!kid) return res.status(404).json({ error: 'No student found for that code.' });
  const [recent] = await db.query('SELECT class_date, status FROM attendance WHERE student_id = ? ORDER BY class_date DESC LIMIT 14', [kid.id]);
  const [fees] = await db.query('SELECT month, amount, status FROM fees WHERE student_id = ? ORDER BY month DESC LIMIT 6', [kid.id]);
  const attended = recent.filter((r) => r.status !== 'absent').length;
  res.json({ ...kid, recent, fees, attendance: recent.length ? Math.round((100 * attended) / recent.length) : null });
});

app.use('/api/study', require('./routes/study'));
app.use('/api/quiz', auth, require('./routes/quiz'));
app.use('/api', auth, require('./routes/data'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API listening on :${port}`));
