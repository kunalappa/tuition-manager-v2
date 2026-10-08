const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const sign = (t) => jwt.sign({ id: t.id, name: t.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Name, email and a password of 6+ characters are required.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query('INSERT INTO tutors (name, email, password_hash) VALUES (?,?,?)', [name, email, hash]);
    res.status(201).json({ token: sign({ id: r.insertId, name }), name });
  } catch (e) {
    res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error: e.code === 'ER_DUP_ENTRY' ? 'That email is already registered.' : 'Could not register.' });
  }
});

router.post('/login', async (req, res) => {
  const [[tutor]] = await db.query('SELECT * FROM tutors WHERE email = ?', [req.body.email || '']);
  if (!tutor || !(await bcrypt.compare(req.body.password || '', tutor.password_hash)))
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(tutor), name: tutor.name });
});

module.exports = router;
