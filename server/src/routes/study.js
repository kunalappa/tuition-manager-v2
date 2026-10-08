const router = require('express').Router();
const db = require('../db');

// Students use the same access code their parents get
async function withStudent(req, res, next) {
  const [[s]] = await db.query(
    `SELECT st.id, st.name, st.batch_id, b.name batch, b.subject FROM students st
     JOIN batches b ON b.id = st.batch_id WHERE st.parent_code = ?`, [req.params.code.toUpperCase()]);
  if (!s) return res.status(404).json({ error: 'No student found for that code.' });
  req.student = s;
  next();
}

router.get('/:code', withStudent, async (req, res) => {
  const s = req.student;
  const [notes] = await db.query(
    `SELECT nt.id, nt.title, nt.created_at, JSON_LENGTH(nt.qa) questions, LEFT(nt.body, 140) preview,
            (np.student_id IS NOT NULL) done
     FROM notes nt LEFT JOIN note_progress np ON np.note_id = nt.id AND np.student_id = ?
     WHERE nt.batch_id = ? ORDER BY nt.created_at DESC`, [s.id, s.batch_id]);
  res.json({ name: s.name, batch: s.batch, subject: s.subject, notes: notes.map((n) => ({ ...n, done: !!n.done })) });
});

router.get('/:code/notes/:id', withStudent, async (req, res) => {
  const [[note]] = await db.query('SELECT id, title, body, qa FROM notes WHERE id = ? AND batch_id = ?', [req.params.id, req.student.batch_id]);
  if (!note) return res.status(404).json({ error: 'Note not found.' });
  res.json(note);
});

router.post('/:code/notes/:id/done', withStudent, async (req, res) => {
  const { id, batch_id } = req.student;
  if (req.body.done)
    await db.query('INSERT IGNORE INTO note_progress (student_id, note_id) SELECT ?, id FROM notes WHERE id = ? AND batch_id = ?', [id, req.params.id, batch_id]);
  else
    await db.query('DELETE FROM note_progress WHERE student_id = ? AND note_id = ?', [id, req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
