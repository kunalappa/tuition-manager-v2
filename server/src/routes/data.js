const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');

const thisMonth = () => new Date().toISOString().slice(0, 7);
const mine = 'b.tutor_id = ?';

router.get('/dashboard', async (req, res) => {
  const id = req.tutor.id;
  const [[s]] = await db.query(`SELECT COUNT(*) n FROM students st JOIN batches b ON b.id = st.batch_id WHERE ${mine}`, [id]);
  const [[due]] = await db.query(
    `SELECT COALESCE(SUM(f.amount),0) total FROM fees f JOIN students st ON st.id = f.student_id
     JOIN batches b ON b.id = st.batch_id WHERE ${mine} AND f.status = 'pending'`, [id]);
  const [[paid]] = await db.query(
    `SELECT COALESCE(SUM(f.amount),0) total FROM fees f JOIN students st ON st.id = f.student_id
     JOIN batches b ON b.id = st.batch_id WHERE ${mine} AND f.status = 'paid' AND f.month = ?`, [id, thisMonth()]);
  const [batches] = await db.query(
    `SELECT b.id, b.name, b.schedule, COUNT(DISTINCT st.id) students,
            ROUND(100 * SUM(a.status <> 'absent') / NULLIF(COUNT(a.id), 0)) attendance
     FROM batches b LEFT JOIN students st ON st.batch_id = b.id LEFT JOIN attendance a ON a.student_id = st.id
     WHERE ${mine} GROUP BY b.id`, [id]);
  const [[nc]] = await db.query(`SELECT COUNT(*) n FROM notes nt JOIN batches b ON b.id = nt.batch_id WHERE ${mine}`, [id]);
  const [owing] = await db.query(
    `SELECT st.name, b.name batch, f.amount FROM fees f JOIN students st ON st.id = f.student_id
     JOIN batches b ON b.id = st.batch_id WHERE ${mine} AND f.status = 'pending' AND f.month = ?
     ORDER BY f.amount DESC, st.name LIMIT 5`, [id, thisMonth()]);
  res.json({ students: s.n, pending: due.total, collected: paid.total, notes: nc.n, owing, batches });
});

router.get('/batches', async (req, res) => {
  const [rows] = await db.query('SELECT id, name, subject, monthly_fee FROM batches b WHERE tutor_id = ?', [req.tutor.id]);
  res.json(rows);
});

router.get('/students', async (req, res) => {
  const [rows] = await db.query(
    `SELECT st.id, st.name, st.parent_name, st.parent_phone, st.parent_code, b.name batch,
            (SELECT COUNT(*) FROM note_progress np WHERE np.student_id = st.id) studied,
            (SELECT COUNT(*) FROM notes nt WHERE nt.batch_id = st.batch_id) total_notes,
            ROUND(100 * SUM(a.status <> 'absent') / NULLIF(COUNT(a.id), 0)) attendance
     FROM students st JOIN batches b ON b.id = st.batch_id LEFT JOIN attendance a ON a.student_id = st.id
     WHERE ${mine} GROUP BY st.id ORDER BY st.name`, [req.tutor.id]);
  res.json(rows);
});

router.post('/students', async (req, res) => {
  const { name, batchId, parentName, parentPhone } = req.body;
  const [[batch]] = await db.query('SELECT id, monthly_fee FROM batches WHERE id = ? AND tutor_id = ?', [batchId, req.tutor.id]);
  if (!name || !batch) return res.status(400).json({ error: 'Enter a name and choose one of your batches.' });
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  const [r] = await db.query(
    'INSERT INTO students (batch_id, name, parent_name, parent_phone, parent_code) VALUES (?,?,?,?,?)',
    [batch.id, name, parentName || null, parentPhone || null, code]);
  await db.query('INSERT INTO fees (student_id, month, amount) VALUES (?,?,?)', [r.insertId, thisMonth(), batch.monthly_fee]);
  res.status(201).json({ id: r.insertId, parent_code: code });
});

router.delete('/students/:id', async (req, res) => {
  await db.query(
    'DELETE st FROM students st JOIN batches b ON b.id = st.batch_id WHERE st.id = ? AND b.tutor_id = ?',
    [req.params.id, req.tutor.id]);
  res.status(204).end();
});

router.get('/attendance', async (req, res) => {
  const { batchId, date } = req.query;
  const [rows] = await db.query(
    `SELECT st.id, st.name, a.status FROM students st JOIN batches b ON b.id = st.batch_id
     LEFT JOIN attendance a ON a.student_id = st.id AND a.class_date = ?
     WHERE ${mine} AND st.batch_id = ? ORDER BY st.name`, [date, req.tutor.id, batchId]);
  res.json(rows);
});

router.post('/attendance', async (req, res) => {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records) || !records.length) return res.status(400).json({ error: 'Nothing to save.' });
  const [owned] = await db.query(
    `SELECT st.id FROM students st JOIN batches b ON b.id = st.batch_id WHERE ${mine} AND st.id IN (?)`,
    [req.tutor.id, records.map((r) => r.studentId)]);
  const ok = new Set(owned.map((o) => o.id));
  for (const r of records.filter((r) => ok.has(r.studentId))) {
    await db.query(
      'INSERT INTO attendance (student_id, class_date, status) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status = VALUES(status)',
      [r.studentId, date, r.status]);
  }
  res.json({ saved: ok.size });
});

router.get('/fees', async (req, res) => {
  const [rows] = await db.query(
    `SELECT f.id, f.amount, f.status, f.paid_on, st.name, b.name batch FROM fees f
     JOIN students st ON st.id = f.student_id JOIN batches b ON b.id = st.batch_id
     WHERE ${mine} AND f.month = ? ORDER BY f.status DESC, st.name`, [req.tutor.id, req.query.month || thisMonth()]);
  res.json(rows);
});

router.patch('/fees/:id/pay', async (req, res) => {
  await db.query(
    `UPDATE fees f JOIN students st ON st.id = f.student_id JOIN batches b ON b.id = st.batch_id
     SET f.status = 'paid', f.paid_on = CURDATE() WHERE f.id = ? AND ${mine}`, [req.params.id, req.tutor.id]);
  res.json({ ok: true });
});

router.get('/notes', async (req, res) => {
  const [rows] = await db.query(
    `SELECT nt.id, nt.title, nt.created_at, b.name batch, JSON_LENGTH(nt.qa) questions,
            (SELECT COUNT(*) FROM note_progress np WHERE np.note_id = nt.id) studied,
            (SELECT COUNT(*) FROM students s WHERE s.batch_id = nt.batch_id) learners
     FROM notes nt JOIN batches b ON b.id = nt.batch_id WHERE ${mine} ORDER BY nt.created_at DESC`, [req.tutor.id]);
  res.json(rows);
});

router.post('/notes', async (req, res) => {
  const { batchId, title, body, qa = [] } = req.body;
  const [[batch]] = await db.query('SELECT id FROM batches WHERE id = ? AND tutor_id = ?', [batchId, req.tutor.id]);
  if (!batch || !title || !body) return res.status(400).json({ error: 'Choose a batch, add a title and write the note.' });
  const pairs = qa.filter((x) => x.q && x.a);
  const [r] = await db.query('INSERT INTO notes (batch_id, title, body, qa) VALUES (?,?,?,?)', [batch.id, title, body, JSON.stringify(pairs)]);
  res.status(201).json({ id: r.insertId });
});

router.delete('/notes/:id', async (req, res) => {
  await db.query('DELETE nt FROM notes nt JOIN batches b ON b.id = nt.batch_id WHERE nt.id = ? AND b.tutor_id = ?', [req.params.id, req.tutor.id]);
  res.status(204).end();
});

module.exports = router;
