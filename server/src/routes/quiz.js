const router = require('express').Router();
const db = require('../db');

async function generate(text) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Offline fallback so the feature still works without an API key
    return text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 40).slice(0, 6)
      .map((s) => ({ type: 'short', q: `Explain in your own words: ${s.trim()}`, answer: s.trim() }));
  }
  const prompt = `Write 8 practice questions (5 multiple choice, 3 short answer) from this chapter for school students.
Reply with only a JSON array: [{"type":"mcq"|"short","q":"","options":["","","",""],"answer":""}]. Omit options for short answers.

${text.slice(0, 12000)}`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error('AI service returned ' + r.status);
  const data = await r.json();
  return JSON.parse(data.content[0].text.replace(/```json|```/g, '').trim());
}

router.post('/', async (req, res) => {
  const { batchId, title, text } = req.body;
  const [[batch]] = await db.query('SELECT id FROM batches WHERE id = ? AND tutor_id = ?', [batchId, req.tutor.id]);
  if (!batch || !title || !text || text.length < 80)
    return res.status(400).json({ error: 'Choose a batch, add a title and paste at least a few sentences.' });
  try {
    const questions = await generate(text);
    await db.query('INSERT INTO question_sets (batch_id, title, questions) VALUES (?,?,?)', [batch.id, title, JSON.stringify(questions)]);
    res.json({ questions });
  } catch (e) {
    res.status(502).json({ error: 'Could not generate questions right now. ' + e.message });
  }
});

module.exports = router;
