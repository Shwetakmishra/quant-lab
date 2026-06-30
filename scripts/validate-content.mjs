import katex from 'katex'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const PATH = 'src/data/content.json'
const ID_RE = /^(np|al|ge|co|pr|st|wp|di|ts)-(fc|qz|fm)-\d+$/
const HEX = /^#[0-9A-Fa-f]{6}$/
const FLOORS = {
  'Number Properties': 40, 'Algebra': 28, 'Geometry': 35, 'Counting': 9,
  'Probability': 12, 'Statistics': 22, 'Word Problems': 13,
  'Data Interpretation': 4, 'Test Strategy': 8,
}
const QUIZ_FLOOR = 3

const args = process.argv.slice(2)
const full = args.includes('--full')
const onlyTopic = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null
const errors = []
const err = (m) => errors.push(m)

const raw = readFileSync(PATH, 'utf8')
let data
try { data = JSON.parse(raw) } catch (e) { console.error('JSON parse failed:', e.message); process.exit(1) }

const names = new Set(data.topics.map((t) => t.name))
const ids = new Set()
const dup = (id) => { if (ids.has(id)) err(`duplicate id ${id}`); ids.add(id) }
const renders = (s, where) => {
  try { katex.renderToString(s, { throwOnError: true, displayMode: true, strict: false }) }
  catch (e) { err(`KaTeX fail in ${where}: ${e.message} :: ${s}`) }
}

// topics
if (data.topics.length !== 9) err(`expected 9 topics, found ${data.topics.length}`)
for (const t of data.topics) {
  if (!t.id || !t.name || !HEX.test(t.color || '') || !HEX.test(t.wash || ''))
    err(`bad topic ${JSON.stringify(t)}`)
}
for (const need of ['Data Interpretation', 'Test Strategy'])
  if (!names.has(need)) err(`missing new topic ${need}`)

// flashcards
let starred = 0
for (const c of data.flashcards) {
  if (!ID_RE.test(c.id) || !c.id.includes('-fc-')) err(`bad flashcard id ${c.id}`)
  dup(c.id)
  if (!names.has(c.topic)) err(`flashcard ${c.id} unknown topic ${c.topic}`)
  if (!c.front?.trim() || !c.answer?.trim()) err(`flashcard ${c.id} missing front/answer`)
  if (c.latex !== undefined) renders(c.latex, `flashcard ${c.id}`)
  if (c.starred === true) starred++
}

// quizzes
for (const q of data.quizzes) {
  if (!ID_RE.test(q.id) || !q.id.includes('-qz-')) err(`bad quiz id ${q.id}`)
  dup(q.id)
  if (!names.has(q.topic)) err(`quiz ${q.id} unknown topic ${q.topic}`)
  const stem = q.question ?? q.questionLatex
  if (!stem?.trim()) err(`quiz ${q.id} missing question/questionLatex`)
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !String(o).trim()))
    err(`quiz ${q.id} must have 4 non-empty options`)
  if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) err(`quiz ${q.id} bad correct index`)
  if (!q.explanation?.trim()) err(`quiz ${q.id} missing explanation`)
  if (q.questionLatex) for (const m of q.questionLatex.match(/\$[^$]+\$/g) || []) renders(m.slice(1, -1), `quiz ${q.id}`)
}

// formulas
for (const f of data.formulas) {
  if (!ID_RE.test(f.id) || !f.id.includes('-fm-')) err(`bad formula id ${f.id}`)
  dup(f.id)
  if (!names.has(f.topic)) err(`formula ${f.id} unknown topic ${f.topic}`)
  if (!f.label?.trim()) err(`formula ${f.id} missing label`)
  if (!f.latex?.trim()) err(`formula ${f.id} missing latex`); else renders(f.latex, `formula ${f.id}`)
}

// per-topic counts + floors
const fcBy = (n) => data.flashcards.filter((c) => c.topic === n).length
const qzBy = (n) => data.quizzes.filter((q) => q.topic === n).length
const fmBy = (n) => data.formulas.filter((f) => f.topic === n).length
console.log('Topic                  fc  qz  fm')
for (const t of data.topics) console.log(t.name.padEnd(22), String(fcBy(t.name)).padStart(2), String(qzBy(t.name)).padStart(3), String(fmBy(t.name)).padStart(3))
const enforce = (n) => {
  if (fcBy(n) < FLOORS[n]) err(`${n}: ${fcBy(n)} flashcards < floor ${FLOORS[n]}`)
  if (qzBy(n) < QUIZ_FLOOR) err(`${n}: ${qzBy(n)} quizzes < floor ${QUIZ_FLOOR}`)
}
if (full) {
  Object.keys(FLOORS).forEach(enforce)
  if (starred < 3) err(`expected >=3 starred flashcards, found ${starred}`)
} else if (onlyTopic) enforce(onlyTopic)

// id-preservation diff vs committed baseline
try {
  const base = JSON.parse(execSync(`git show HEAD:${PATH}`, { encoding: 'utf8' }))
  const now = new Map([...data.flashcards, ...data.quizzes, ...data.formulas].map((e) => [e.id, JSON.stringify(e)]))
  for (const e of [...base.flashcards, ...base.quizzes, ...base.formulas]) {
    if (!now.has(e.id)) err(`baseline id removed: ${e.id}`)
    else if (now.get(e.id) !== JSON.stringify(e)) err(`baseline id altered: ${e.id}`)
  }
} catch { console.warn('WARN: could not diff against git baseline (ok on first run if file uncommitted)') }

if (errors.length) { console.error(`\nFAIL (${errors.length}):`); errors.forEach((e) => console.error('  -', e)); process.exit(1) }
console.log(`\nPASS — ${data.flashcards.length} flashcards, ${data.quizzes.length} quizzes, ${data.formulas.length} formulas, ${starred} starred`)
