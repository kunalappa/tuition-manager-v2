require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./src/db');

const batches = [
  ['Class 10 Maths', 'Mathematics', 'Mon, Wed, Fri · 5:00 PM', 1800],
  ['Class 9 Science', 'Science', 'Tue, Thu · 4:30 PM', 1500],
  ['Class 8 English', 'English', 'Sat · 10:00 AM', 1000],
];
const kids = ['Aarav Kulkarni', 'Diya Patil', 'Rohan Deshmukh', 'Ananya Joshi', 'Kabir Shaikh', 'Meera Nair',
  'Vihaan Pawar', 'Isha Kapoor', 'Arjun More', 'Sara Khan', 'Tanvi Jadhav', 'Yash Bhosale'];

(async () => {
  await db.query("DELETE FROM tutors WHERE email = 'demo@tutor.com'");
  const [t] = await db.query('INSERT INTO tutors (name, email, password_hash) VALUES (?,?,?)',
    ['Priya Sharma', 'demo@tutor.com', await bcrypt.hash('demo1234', 10)]);
  const ids = [];
  for (const [name, subject, schedule, fee] of batches) {
    const [b] = await db.query('INSERT INTO batches (tutor_id, name, subject, schedule, monthly_fee) VALUES (?,?,?,?,?)', [t.insertId, name, subject, schedule, fee]);
    ids.push([b.insertId, fee]);
  }
  const now = new Date();
  const month = (back) => new Date(now.getFullYear(), now.getMonth() - back, 1).toISOString().slice(0, 7);
  for (const [i, name] of kids.entries()) {
    const [batchId, fee] = ids[i % 3];
    const [s] = await db.query('INSERT INTO students (batch_id, name, parent_name, parent_phone, parent_code) VALUES (?,?,?,?,?)',
      [batchId, name, 'Parent of ' + name.split(' ')[0], '98' + String(10000000 + i * 137), crypto.randomBytes(4).toString('hex').toUpperCase()]);
    const rows = [];
    for (let d = 1; d <= 21; d++) {
      const day = new Date(now); day.setDate(now.getDate() - d);
      if (day.getDay() === 0) continue;
      const roll = Math.random();
      rows.push([s.insertId, day.toISOString().slice(0, 10), roll < 0.8 ? 'present' : roll < 0.9 ? 'late' : 'absent']);
    }
    await db.query('INSERT INTO attendance (student_id, class_date, status) VALUES ?', [rows]);
    await db.query("INSERT INTO fees (student_id, month, amount, status, paid_on) VALUES (?,?,?,'paid',CURDATE())", [s.insertId, month(1), fee]);
    const paid = i % 3 !== 0;
    await db.query('INSERT INTO fees (student_id, month, amount, status, paid_on) VALUES (?,?,?,?,?)',
      [s.insertId, month(0), fee, paid ? 'paid' : 'pending', paid ? new Date().toISOString().slice(0, 10) : null]);
  }
  const topics = [
    [['Quadratic equations: key formulas', 'A quadratic equation has the form ax² + bx + c = 0. The roots come from x = (−b ± √(b² − 4ac)) / 2a. The discriminant b² − 4ac tells you what kind of roots to expect: positive gives two real roots, zero gives one repeated root, and negative gives no real roots.',
      [['What does the discriminant tell us?', 'The nature of the roots: two real, one repeated, or none.'], ['State the quadratic formula.', 'x = (−b ± √(b² − 4ac)) / 2a']]],
     ['Trigonometric ratios', 'In a right-angled triangle, sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse and tan θ = opposite/adjacent. A useful identity to remember is sin²θ + cos²θ = 1.',
      [['Write the Pythagorean identity.', 'sin²θ + cos²θ = 1'], ['Define tan θ.', 'Opposite side divided by adjacent side.']]]],
    [['Photosynthesis in plants', 'Plants make glucose from carbon dioxide and water using light energy captured by chlorophyll in the chloroplasts. Oxygen is released as a by-product. The overall reaction is 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.',
      [['Where does photosynthesis happen?', 'In the chloroplasts, which contain chlorophyll.'], ['Name the by-product.', 'Oxygen.']]],
     ['Newton’s laws of motion', 'First law: an object stays at rest or in uniform motion unless a net force acts on it. Second law: F = ma. Third law: every action has an equal and opposite reaction.',
      [['State the second law as a formula.', 'F = ma'], ['Give an example of the third law.', 'A rocket pushes gas down and the gas pushes the rocket up.']]]],
    [['Tenses: present perfect', 'Use the present perfect (have/has + past participle) for actions that started in the past and still matter now, such as “She has finished her homework.” Signal words include already, yet, just, ever and never.',
      [['Form the present perfect of “to write”.', 'have/has written'], ['Name two signal words.', 'For example already and yet.']]],
     ['Writing a formal letter', 'A formal letter has the sender’s address, date, receiver’s address, a subject line, a salutation, the body in short paragraphs, and a complimentary close such as “Yours faithfully”.',
      [['Which close goes with “Dear Sir”?', 'Yours faithfully.']]]],
  ];
  for (const [i, list] of topics.entries()) {
    const [pupils] = await db.query('SELECT id FROM students WHERE batch_id = ?', [ids[i][0]]);
    for (const [title, body, qa] of list) {
      const [n] = await db.query('INSERT INTO notes (batch_id, title, body, qa) VALUES (?,?,?,?)',
        [ids[i][0], title, body, JSON.stringify(qa.map(([q, a]) => ({ q, a })))]);
      for (const p of pupils)
        if (Math.random() < 0.55) await db.query('INSERT INTO note_progress (student_id, note_id) VALUES (?,?)', [p.id, n.insertId]);
    }
  }
  console.log('Seeded. Sign in with demo@tutor.com / demo1234');
  process.exit(0);
})();
