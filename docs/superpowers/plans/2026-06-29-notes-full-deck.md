# Full Deck from GRE Notes PDFs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `src/data/content.json` to hold the full content of both GRE notes PDFs — every Q&A as a flashcard, formulas extracted, quizzes crafted — across a topic set grown from 7 to 9, without breaking any existing card id.

**Architecture:** Pure data change to one JSON file, plus a standalone Node validator script that mirrors the app's KaTeX usage and gates every task. Content is authored topic-by-topic, transcribed from committed plain-text extracts of the two PDFs. No app/logic/screen/Supabase changes.

**Tech Stack:** Node 18+ (ESM), `katex@0.16.11` (already a dependency), `git` (for the id-preservation diff), `python3`+`pypdf` (one-time PDF→text extraction).

## Global Constraints

- **Source of truth:** the two PDFs at `~/Downloads/GRE_Quant_Complete_Notes.pdf` (191 Q&As) and `~/Downloads/GRE_Quant_BurnIn_Sheet.pdf`. Content is **transcribed** from the committed text extracts (Task 1), never invented.
- **Never renumber or alter an existing entry.** Every `id` currently in `content.json` must remain, byte-for-byte. New entries are appended.
- **`id` format:** `^(np|al|ge|co|pr|st|wp|di|ts)-(fc|qz|fm)-\d+$`, globally unique. Prefixes: `np` Number Properties, `al` Algebra, `ge` Geometry, `co` Counting, `pr` Probability, `st` Statistics, `wp` Word Problems, `di` Data Interpretation, `ts` Test Strategy. Types: `fc` flashcard, `qz` quiz, `fm` formula.
- **Entry schemas** (match existing entries exactly):
  - topic: `{ "id": kebab, "name": String, "color": "#RRGGBB", "wash": "#RRGGBB" }`
  - flashcard: `{ "id", "topic": <topic name>, "front": String, "answer": String, "latex"?: String, "starred"?: true }`
  - quiz: `{ "id", "topic", ("question" | "questionLatex"): String, "options": [4 strings], "correct": int 0–3, "explanation": String }`
  - formula: `{ "id", "topic", "label": String, "latex": String }`
- **`topic` value is the topic *name* string** (e.g. `"Number Properties"`), not the kebab id.
- **LaTeX:** every `latex` and every `$…$` segment inside a `questionLatex` must render under KaTeX with `throwOnError: true, strict: false`. Match the existing LaTeX style (`\dfrac`, `\tfrac`, `^{}`, `\sqrt{}`, `{}^{n}C_{r}`, etc.).
- **Dedup:** if a Q&A restates a concept already in `content.json` (or already added from the other PDF), keep the existing entry and skip the duplicate. No near-duplicate pairs.
- **Full deck:** every Complete-Notes Q&A is represented as a flashcard (existing card counts toward this when it already covers that Q&A).
- **Commit after every task.** End commit messages with the `Co-Authored-By` trailer used in this repo.

---

### Task 1: Extract source text and build the content validator

**Files:**
- Create: `docs/superpowers/notes/complete-notes.txt`
- Create: `docs/superpowers/notes/burn-in-sheet.txt`
- Create: `scripts/validate-content.mjs`

**Interfaces:**
- Produces: `node scripts/validate-content.mjs [--topic "<Topic Name>"] [--full]` — exits 0 on pass, 1 on failure, printing per-topic counts. Default run enforces structure + KaTeX + id-preservation + starred floor. `--topic` additionally enforces that one topic's coverage floor. `--full` enforces all coverage/quiz floors.

- [ ] **Step 1: Extract both PDFs to committed text**

Run:
```bash
cd /Users/sunstone/quantlab && mkdir -p docs/superpowers/notes scripts
python3 -m pip install --quiet pypdf
python3 - <<'PY'
from pypdf import PdfReader
import pathlib
src = pathlib.Path.home() / "Downloads"
out = pathlib.Path("docs/superpowers/notes")
for pdf, name in [("GRE_Quant_Complete_Notes.pdf","complete-notes.txt"),
                  ("GRE_Quant_BurnIn_Sheet.pdf","burn-in-sheet.txt")]:
    r = PdfReader(str(src/pdf))
    (out/name).write_text("\n".join(p.extract_text() for p in r.pages))
    print(name, "pages:", len(r.pages))
PY
grep -c '^\s*Q\.' docs/superpowers/notes/complete-notes.txt
```
Expected: prints `complete-notes.txt pages: 10`, `burn-in-sheet.txt pages: 4`, and a Q-count of `191`.

- [ ] **Step 2: Write the validator script**

Create `scripts/validate-content.mjs`:
```js
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

// starred floor
if (starred < 3) err(`expected >=3 starred flashcards, found ${starred}`)

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
if (full) Object.keys(FLOORS).forEach(enforce)
else if (onlyTopic) enforce(onlyTopic)

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
```

- [ ] **Step 3: Run the validator against the current (unchanged) file**

Run: `node scripts/validate-content.mjs`
Expected: `FAIL` — it reports `expected 9 topics, found 7` and the new-topic/floor messages are not yet relevant. This confirms the validator runs and parses. (Structure of existing entries and all existing KaTeX must NOT appear in the failure list — if any existing `latex` is reported as a KaTeX failure, fix the validator, not the data.)

- [ ] **Step 4: Add an npm script**

Modify `package.json` `scripts` to add: `"validate:content": "node scripts/validate-content.mjs"` (insert after the `preview` line, keeping valid JSON).

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/notes scripts/validate-content.mjs package.json
git commit -m "Add PDF text extracts + content validator script

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add the two new topics and update the source note

**Files:**
- Modify: `src/data/content.json` (the `topics` array and `_note`)

**Interfaces:**
- Produces: topic names `"Data Interpretation"` and `"Test Strategy"` available to all later tasks.

- [ ] **Step 1: Append the two topics**

Add to the END of the `topics` array (after `word-problems`):
```json
{ "id": "data-interpretation", "name": "Data Interpretation", "color": "#B5667E", "wash": "#F7E6EC" },
{ "id": "test-strategy", "name": "Test Strategy", "color": "#7A7196", "wash": "#ECEAF2" }
```
(Add a comma after the `word-problems` entry; the `test-strategy` entry is last and takes no trailing comma.)

- [ ] **Step 2: Update `_note`**

Replace the `_note` value with:
```
"Content source of truth, transcribed from GRE_Quant_Complete_Notes.pdf and GRE_Quant_BurnIn_Sheet.pdf (text extracts in docs/superpowers/notes/). Edit freely without touching app logic. Formulas are KaTeX/LaTeX strings. id values are the primary key in the Supabase card_reviews table — never renumber existing ids."
```

- [ ] **Step 3: Validate**

Run: `node scripts/validate-content.mjs`
Expected: still `FAIL`, but the `expected 9 topics` and `missing new topic` errors are GONE. Remaining failures are only coverage-floor messages (which default runs do not enforce) — so with no `--full`/`--topic`, the only expected errors now are none from structure; if the run prints `PASS` that is also acceptable. Confirm no KaTeX or id-preservation errors appear.

- [ ] **Step 4: Commit**

```bash
git add src/data/content.json
git commit -m "Add Data Interpretation + Test Strategy topics

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Authoring convention for Tasks 3–11 (read once)

Each topic task appends entries to the three arrays in `src/data/content.json`. For each task:

1. Open the relevant **source ranges** in `docs/superpowers/notes/*.txt` and read every Q&A for the topic.
2. **Flashcards** — one per Q&A, *except* those in the task's **Dedup** list (already covered). New ids continue the topic's existing sequence (each task states the first new number). `front` = the question (clean typography: real `×`, `−`, superscripts like `pᵃ`), `answer` = the answer text. Add `latex` only when the card has a clean formula. Worked example (Number Properties):
   ```json
   { "id": "np-fc-7", "topic": "Number Properties", "front": "What are integers?", "answer": "…, −2, −1, 0, 1, 2, … — whole numbers plus their negatives, extending in both directions." }
   ```
   With a formula:
   ```json
   { "id": "np-fc-12", "topic": "Number Properties", "front": "Sum of the first n positive integers?", "latex": "\\dfrac{n(n+1)}{2}", "answer": "e.g. 1+2+…+100 = 5050." }
   ```
3. **Formulas** — extract every formula-bearing fact not already in `formulas` (see the task's formula Dedup note). Worked example:
   ```json
   { "id": "ge-fm-16", "topic": "Geometry", "label": "Point-slope form of a line", "latex": "y - y_1 = m(x - x_1)" }
   ```
4. **Quizzes** — author the number stated in the task (target ~6), each from a *testable* fact, with three plausible (wrong-but-tempting) distractors. Use `questionLatex` with `$…$` when math reads better, else `question`. Worked example:
   ```json
   { "id": "ge-qz-6", "topic": "Geometry", "question": "Reflecting (x, y) across the line y = x gives:", "options": ["(y, x)", "(−y, −x)", "(−x, −y)", "(x, −y)"], "correct": 0, "explanation": "Reflection across y = x swaps the coordinates: (x, y) → (y, x)." }
   ```
5. Run `node scripts/validate-content.mjs --topic "<Topic Name>"` → must PASS (structure, KaTeX, this topic's floor, id-preservation).
6. Commit with message `Add <Topic> deck from notes` + the Co-Authored-By trailer.

Each task's deliverable is independently testable via step 5.

---

### Task 3: Number Properties

**Files:** Modify `src/data/content.json`.
**Source:** `complete-notes.txt` §1 (Number types, Fractions, Properties of 0 & 1) and §2 (Factors, Multiples & Divisibility); GRE Extras "Absolute value & number line" and "A few more commonly-tested facts"; `burn-in-sheet.txt` §1 (the ÷5 remainder rule: unit 0–4 → that digit, 5–9 → digit−5).
**New id starts:** `np-fc-7`, `np-qz-5`, `np-fm-9`.
**Dedup — skip these flashcard concepts (already present):** np-fc-1 factors of pᵃqᵇ, np-fc-2 trailing zeros, np-fc-3 Legendre exponent, np-fc-4 terminating decimal, np-fc-5 successive ±20%, np-fc-6 a vs a² vs √a (0<a<1). **Skip these formula concepts:** np-fm-1..8 (factors, trailing zeros, Legendre, percent increase, percent decrease, terminating denominator, abs triangle inequality, ratio part-to-whole share).
**Must add (flashcard checklist):** natural/whole/integers/rational/irrational definitions, 0.333… is rational, number hierarchy; proper/improper/mixed, fully-repeating→fraction, mixed-repeating→fraction; 0⁰, 0!, key facts about 0; odd/even factor counts + why strip 2s; divisibility ÷2,÷3,÷4,÷5,÷6,÷8,÷9,÷11; remainder via digit sum (÷3,÷9), remainder via last digits (÷4/8/10), ÷5 remainder rule (Burn-In), remainder when divisor > number; HCF ladder, LCM ladder, co-prime, prime test (≤√n), floor function (incl. negatives); |x| meaning, solve |x−3|=5, solve |x|<5 vs |x|>5, |a+b|≤|a|+|b| & |ab|=|a||b|; sum of first n integers, first n even = n(n+1), first n odd = n², primes under 20, squares 11–15, fraction↔percent conversions, negative base to even/odd power.
**Quizzes:** author ~8 (e.g. divisibility by 11, ÷5 remainder, trailing zeros, hierarchy, |x|<5, sum of first n integers, first n odd, terminating decimal).
**Formulas to add:** sum of first n integers `\dfrac{n(n+1)}{2}`, first n even `n(n+1)`, first n odd `n^{2}`, `|ab| = |a|\,|b|`, mixed-repeating decimal → fraction form. (Skip any already in np-fm.)

Steps: follow the Authoring convention 1–6. Step 5 command: `node scripts/validate-content.mjs --topic "Number Properties"`.

---

### Task 4: Algebra

**Files:** Modify `src/data/content.json`.
**Source:** `complete-notes.txt` §3 (Exponents & identities, Quadratics, Inequalities/ratios/interest — exponent & identity & quadratic & inequality parts only; interest/mixture go to Word Problems in Task 9) and §4 (Sequences & Series); `burn-in-sheet.txt` §2–3 for the "1 is the magnet" framing and polynomial test.
**New id starts:** `al-fc-7`, `al-qz-5`, `al-fm-13`.
**Dedup — skip flashcards:** al-fc-1 quadratic formula, al-fc-2 discriminant, al-fc-3 sum/product of roots, al-fc-4 vertex/axis, al-fc-5 difference of squares, al-fc-6 sum of arithmetic sequence. **Skip formulas:** al-fm-1..12 (quadratic formula, discriminant, sum of roots, product of roots, axis of symmetry, difference of squares, square of a sum, cube of a sum, # terms in arithmetic seq, sum of arithmetic seq, sum of geometric seq, summation notation).
**Must add (flashcard checklist):** exponent rules xᵃ·xᵇ, xᵃ/xᵇ, xᵃ·yᵃ, x⁻ⁿ, x⁰=1; (a+b)³, (a−b)³, (a−b)², (a+b)(a−b)=a²−b², √(a²)=|a|; polynomial test; completing the square; √ symbol (+root) vs solving x²=36 (±); when to flip an inequality; a vs a² vs √a for a>1; arithmetic/geometric/harmonic/quadratic sequence definitions; sequence vs series; number of terms in a spaced series; infinite geometric sum; slope of a quadratic = 2ax+b (this is calculus-flavored but lives with Algebra here per coordinate-geometry overlap — place in Geometry instead if it reads better; default Algebra).
**Quizzes:** author ~6 (e.g. x⁻ⁿ, (a−b)³ signs, √(a²)=|a|, inequality flip, infinite geometric sum, harmonic sequence).
**Formulas to add:** `x^{-n} = \dfrac{1}{x^{n}}`, `(a-b)^{3} = a^{3} - 3a^{2}b + 3ab^{2} - b^{3}`, `(a-b)^{2} = a^{2} - 2ab + b^{2}`, infinite geometric sum `S = \dfrac{a}{1-r}`, `\sqrt{a^{2}} = |a|`.

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Algebra"`.

---

### Task 5: Geometry

**Files:** Modify `src/data/content.json`.
**Source:** `complete-notes.txt` §5 (Coordinate Geometry) and §6 (Triangles, Polygons & Solids); `burn-in-sheet.txt` §4–5 (volume ratio of similar solids = (side ratio)³; interior+exterior = 180° per corner; y=x slope=1 region rule).
**New id starts:** `ge-fc-8`, `ge-qz-6`, `ge-fm-16`.
**Dedup — skip flashcards:** ge-fc-1 distance, ge-fc-2 area of equilateral, ge-fc-3 central vs inscribed angle, ge-fc-4 Pythagoras, ge-fc-5 interior angle sum, ge-fc-6 30-60-90 ratio, ge-fc-7 cube diagonal. **Skip formulas:** ge-fm-1..15 (distance, midpoint, slope, Pythagoras, triangle area, equilateral area, circumference, circle area, sector area, interior angle sum, cylinder volume, cylinder SA, cuboid diagonal, circle equation, trapezoid area).
**Must add (flashcard checklist):** slope (rise/run), horizontal/vertical slope, slope-intercept form, point-slope form, parallel/perpendicular slopes, midpoint, circle equation & center/radius, reflections (y=x, y=−x, y=k, x=k), rotations (90° ccw, 90° cw, 180°), parabola opens up/down, x/y-intercepts, graph shifts (x−h)²+k; exterior angle sum=360°, each interior/exterior of regular polygon, Pythagorean triples list, 45-45-90 ratio, similar triangles criteria + area ratio (side²) + **volume ratio (side³, Burn-In)**, congruence criteria (SSS/SAS/ASA/AAS; AA not enough), sector/arc proportion, largest-area-for-perimeter (circle), regular maximizes area, regular hexagon radius=side; areas of parallelogram/rhombus/rectangle, trapezoid (already as formula — flashcard the "why average" reasoning), cube SA/Vol, cuboid SA/Vol, cylinder Vol/SA.
**Trapezoid is a starred Watch-These card:** add the trapezoid-area flashcard with the richer "why the average of the parallel sides" explanation from `burn-in-sheet.txt` and mark it `"starred": true`. Example:
```json
{ "id": "ge-fc-NN", "topic": "Geometry", "front": "Area of a trapezoid — and why the average?", "latex": "\\dfrac{b_1 + b_2}{2}\\times h", "answer": "A trapezoid is almost a rectangle, but its two parallel sides differ (b₁ ≠ b₂), so there's no single width — use the average of the parallel sides as the effective width, times the height.", "starred": true }
```
**Quizzes:** author ~7 (e.g. perpendicular slope, reflection across y=x, 90° rotation, circle center from equation, exterior angle sum, volume ratio of similar solids, cylinder surface area).
**Formulas to add:** point-slope `y - y_1 = m(x - x_1)`, slope-intercept `y = mx + c`, reflection/rotation maps (as labeled latex, e.g. `(x,y)\to(y,x)`), volume ratio `\left(\dfrac{s_1}{s_2}\right)^{3}`, each exterior angle `\dfrac{360^{\circ}}{n}`.

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Geometry"`.

---

### Task 6: Counting

**Files:** Modify `src/data/content.json`.
**Source:** `complete-notes.txt` §8 counting half (permutation vs combination, nPr, nCr, perms with repeats, circular arrangements, handshake, paths with m/n, overlapping sets 2 & 3, "exactly one" vs "at least one"); `burn-in-sheet.txt` §7 keyword cues (arrange/rank/seat → P; group/select/team → C; C ≤ P).
**New id starts:** `co-fc-7`, `co-qz-5`, `co-fm-11`.
**Dedup — skip flashcards:** co-fc-1 perm with repetition (nʳ), co-fc-2 nCr, co-fc-3 nPr, co-fc-4 circular, co-fc-5 handshakes, co-fc-6 arrangements with repeats. **Skip formulas:** co-fm-1..10 (n!, nPr, nCr, nʳ, repeats, circular, symmetry, handshakes, grid paths, inclusion-exclusion 2 sets).
**Must add (flashcard checklist):** permutation vs combination distinction + keyword cues (Burn-In), perms with repeated items (n!/(r₁!r₂!…)), paths/arrangements with m of one type & n of another, overlapping sets — two sets, overlapping sets — three sets, "exactly one" vs "at least one" in sets, C ≤ P relationship.
**Quizzes:** author ~5 (e.g. order-matters→permutation keyword, circular seating, 3-set overlap formula, exactly-one vs at-least-one, perms with repeats).
**Formulas to add:** inclusion-exclusion (3 sets) `|A\cup B\cup C| = |A|+|B|+|C| - |A\cap B| - |A\cap C| - |B\cap C| + |A\cap B\cap C|`.

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Counting"`.

---

### Task 7: Probability

**Files:** Modify `src/data/content.json`.
**Source:** `complete-notes.txt` §8 probability half (basic probability, complement, P(A or B), mutually exclusive, independent, why multiply for AND, expected value, EV of a game, binomial conditions BINS, binomial formula) and GRE Extras "Probability shortcuts" (at-least-one fast way, with/without replacement); `burn-in-sheet.txt` "★ Watch These" (why AND multiplies) and §7 diagnostics.
**New id starts:** `pr-fc-7`, `pr-qz-5`, `pr-fm-8`.
**Dedup — skip flashcards:** pr-fc-1 basic probability, pr-fc-2 at-least-one, pr-fc-3 P(A or B), pr-fc-4 independent AND, pr-fc-5 complement, pr-fc-6 binomial. **Skip formulas:** pr-fm-1..7 (probability, complement, at-least-one, independent AND, general OR, conditional, binomial).
**Must add (flashcard checklist):** mutually exclusive meaning + P(A and B)=0 + diagnostic, independent meaning + diagnostic, **why AND multiplies** (the "fraction of a fraction" explanation — starred), expected value E[X], EV of a game interpretation (>0/<0/=0), binomial conditions BINS, with/without replacement (dependent vs independent).
**Why-AND-multiplies is a starred Watch-These card:**
```json
{ "id": "pr-fc-NN", "topic": "Probability", "front": "Why do you multiply for AND (independent events)?", "latex": "P(A \\cap B) = P(A)\\times P(B)", "answer": "'Both must happen' narrows the possibilities twice — the second probability acts on what survived the first, a fraction of a fraction. One factor per condition. AND → multiply (narrows, smaller); OR → add (widens, bigger).", "starred": true }
```
**Quizzes:** author ~5 (e.g. mutually exclusive overlap=0, independent AND, expected value sign, BINS conditions, without-replacement dependence).
**Formulas to add:** expected value of a game `(\text{gain})P(\text{win}) + (\text{loss})P(\text{lose})` (if not redundant with st-fm-10 — st has generic E(X); this game form is distinct and lives in Probability).

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Probability"`.

---

### Task 8: Statistics

**Files:** Modify `src/data/content.json`.
**Source:** `complete-notes.txt` §7 (Statistics incl. Quartiles/percentiles/spread); `burn-in-sheet.txt` §6 ("★ Watch These" continuous uniform = area; z-score bell slices 34/13.5/2.5, z=+2 → ~97.5th).
**New id starts:** `st-fc-7`, `st-qz-6`, `st-fm-13`.
**Dedup — skip flashcards:** st-fc-1 z-score, st-fc-2 empirical rule, st-fc-3 population SD, st-fc-4 weighted average, st-fc-5 IQR, st-fc-6 expected value. **Skip formulas:** st-fm-1..12 (mean, weighted avg, range, population SD, sample SD, IQR, percentile rank, z-score, empirical rule, expected value, continuous uniform mean, continuous uniform SD).
**Must add (flashcard checklist):** mean/median/mode definitions, mean of evenly-spaced set, range, what SD measures, SD never negative / 0 when identical, SD under add/subtract constant (unchanged), SD under multiply/divide by k (scales by k), empirical rule, 68% splits 34/34, value range for a % (mean ± n·SD), z-score percentiles (z=0→50th, +1→84th, **+2→~97.5th**, −2→~2.5th) + **bell slices 34/13.5/2.5 (Burn-In)**, mean controls location, SD controls width, discrete uniform 1/n, **continuous uniform = area, height 1/(b−a), mean (a+b)/2 (starred)**, quartiles divide into 4, finding Q1/Q2/Q3, IQR (have formula; add concept card if distinct), boxplot five-number summary, percentile rank, standardization.
**Continuous-uniform is a starred Watch-These card:**
```json
{ "id": "st-fc-NN", "topic": "Statistics", "front": "Continuous uniform distribution — why is probability area, not 1/n?", "latex": "\\text{height} = \\dfrac{1}{b-a}", "answer": "With infinitely many possible values, any exact point has probability ~0, so ask about ranges. Probability = area under a flat rectangle of total area 1, so height = 1/(b−a) and P(sub-range) = length × height. Mean = median = (a+b)/2.", "starred": true }
```
**Quizzes:** author ~6 (e.g. SD under +constant, z=+1 percentile, continuous uniform height, mean of evenly-spaced set, boxplot summary, empirical 68% split).
**Formulas to add:** discrete uniform `P = \dfrac{1}{n}`, continuous uniform height `\dfrac{1}{b-a}` (if distinct from existing mean/SD entries).

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Statistics"`.

---

### Task 9: Word Problems

**Files:** Modify `src/data/content.json`.
**Source:** GRE Extras "Ratios & proportions", "Percents (advanced)", "Rates: speed, distance, work"; `complete-notes.txt` §3 interest & mixture (simple interest, compound interest, mixture/concentration, quick % change ×(1±x/100)).
**New id starts:** `wp-fc-7`, `wp-qz-5`, `wp-fm-8`.
**Dedup — skip flashcards:** wp-fc-1 distance/rate/time, wp-fc-2 work (identical machines), wp-fc-3 simple interest, wp-fc-4 compound interest, wp-fc-5 profit, wp-fc-6 relative speed. **Skip formulas:** wp-fm-1..7 (profit, distance, average speed, work, mixture, simple interest, compound interest).
**Must add (flashcard checklist):** what a ratio is & how to scale, combining ratios (a:b and b:c), direct vs inverse proportion, splitting a quantity in a ratio; successive percent changes (multiply, not add), percent of a percent, "percent of B" vs "percent greater than B", quick %-change multiplier ×(1±x/100); round-trip average speed = 2ab/(a+b), combined work rate xy/(x+y), relative speed same vs opposite (concept may overlap wp-fc-6 — skip if duplicate).
**Quizzes:** author ~6 (e.g. combine ratios, inverse proportion, successive ±20% net effect, percent-of vs percent-greater-than, round-trip average speed, combined work rate).
**Formulas to add:** direct proportion `y = kx`, inverse proportion `y = \dfrac{k}{x}`, round-trip average speed `\dfrac{2ab}{a+b}`, combined work rate `\dfrac{xy}{x+y}`, percent-change multiplier `\times\left(1 \pm \dfrac{x}{100}\right)`.

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Word Problems"`.

---

### Task 10: Data Interpretation (new topic)

**Files:** Modify `src/data/content.json`.
**Source:** GRE Extras "Data interpretation (a whole GRE question type)".
**New id starts:** `di-fc-1`, `di-qz-1`, `di-fm-1` (no existing entries).
**Dedup:** none (new topic).
**Must add (flashcard checklist):** what a Data Interpretation set is, reading a pie chart (slice % × total = value; whole = 100% = 360°), common DI traps (axis scales/start-at-0, units thousands vs millions, value vs percent-change), and a card on reading bar/line charts off the axes.
**Quizzes:** author ~3 (e.g. pie slice value, 100% = 360°, a DI trap about axis scaling).
**Formulas to add:** pie slice value `\text{slice \%} \times \text{total}`, degrees-of-a-slice `\dfrac{\text{value}}{\text{total}} \times 360^{\circ}`.

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Data Interpretation"`.

---

### Task 11: Test Strategy (new topic)

**Files:** Modify `src/data/content.json`.
**Source:** GRE Extras "GRE-specific strategy" and the questions about Numeric Entry, Multiple-answer, calculator, plugging in numbers, back-solving.
**New id starts:** `ts-fc-1`, `ts-qz-1`, `ts-fm-1`.
**Dedup:** none (new topic).
**Must add (flashcard checklist):** what a Quantitative Comparison (QC) question is (4 fixed answers), QC strategy (make equal then test 0/1/fraction/negative), QC "cannot be determined" trap (variables may be negative/fraction/zero), Numeric Entry (type the answer; watch form/rounding/units), Multiple-answer "select all that apply", smart calculator use (estimate first), plugging in numbers (when/how), back-solving from answer choices.
**Quizzes:** author ~4 (e.g. what QC asks, the cannot-be-determined trap, when to plug in numbers, multiple-answer rule). These are concept quizzes — use `question` (no LaTeX needed).
**Formulas:** none expected for this topic (it is strategy, not formulas) — Test Strategy may legitimately have 0 formulas; the validator does not floor formulas.

Steps: Authoring convention 1–6. Step 5: `node scripts/validate-content.mjs --topic "Test Strategy"`.

---

### Task 12: Full verification and build smoke test

**Files:** none (verification only).

- [ ] **Step 1: Full coverage validation**

Run: `node scripts/validate-content.mjs --full`
Expected: `PASS — <N> flashcards, <M> quizzes, <K> formulas, 3 starred` with no FAIL block. Every topic meets its flashcard floor and quiz floor; all KaTeX renders; no baseline id was removed or altered; exactly ≥3 starred cards.

- [ ] **Step 2: Confirm full-deck coverage by eye**

Run: `grep -c '^\s*Q\.' docs/superpowers/notes/complete-notes.txt` (expect 191) and review the per-topic `fc` counts printed by Step 1 against the floors table. Spot-check 5 random Complete-Notes Q&As and confirm each appears as a flashcard (or is in a documented dedup list).

- [ ] **Step 3: Production build smoke test**

Run: `npm run build`
Expected: Vite build completes with no errors (content.json is imported by `src/lib/content.js`, so a malformed file or bad import would fail the build).

- [ ] **Step 4: Manual app check**

Run: `npm run dev`, open the app, and verify: the sidebar shows 9 topics including Data Interpretation and Test Strategy; each new topic shows cards in Flashcards, entries in Formulas (DI only), and questions in Quizzes; a few KaTeX formulas render correctly. Stop the dev server when done.

- [ ] **Step 5: Final commit**

```bash
git add src/data/content.json
git commit -m "Verify full deck: 9 topics across flashcards, formulas, quizzes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
(If Tasks 3–11 each committed their own topic, this commit may be empty — in that case skip it.)

---

## Self-Review

- **Spec coverage:** Sources (both PDFs) → Task 1 extracts both, Tasks 3–11 cite Burn-In refinements. New topics → Task 2. ID scheme/no-renumber → Global Constraints + validator id-preservation diff. Dedup → per-task Dedup lists. Topic mapping → Tasks 3–11 follow the spec table. Flashcards 1:1 → per-task "must add" checklists + 191 floor sum. Formulas extracted → per-task "formulas to add". Quizzes crafted subset (~6/topic) → per-task quiz targets + QUIZ_FLOOR. Starred → Tasks 5/7/8 add the three starred cards; validator floors starred ≥3. Verification pass → Task 1 validator + Task 12. `_note` update → Task 2.
- **Placeholders:** none — validator code is complete; each topic task lists exact id starts, dedup lists, and must-add checklists; example JSON given for each entry type.
- **Type consistency:** id prefixes/types, topic-name-as-`topic`, 4-option quizzes with integer `correct`, and `latex`/`questionLatex` rendering are consistent between Global Constraints, the validator, and every task.
- **Floors note:** per-topic flashcard floors are completeness *minimums* (a scriptable proxy), not exact 1:1 proof; Task 12 Step 2 adds the manual coverage spot-check.
