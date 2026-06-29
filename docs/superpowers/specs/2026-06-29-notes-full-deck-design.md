# Quant Lab — Full Deck from GRE_Quant_Complete_Notes.pdf

**Date:** 2026-06-29
**Author:** Shweta (with Claude)
**Status:** Approved design, ready for implementation plan

## Goal

Integrate the full content of **both** source PDFs into the app's content source of truth,
`src/data/content.json`, and expand all three study modes — Flashcards, Formulas, and Quizzes —
across a topic set grown from 7 to 9.

## Sources

1. **`~/Downloads/GRE_Quant_Complete_Notes.pdf`** — flashcard-ready set of **191** atomic Q&As
   across 8 sections plus a "GRE Extras" appendix. Verbatim count confirmed by script.
2. **`~/Downloads/GRE_Quant_BurnIn_Sheet.pdf`** — a 4-page consolidated revision sheet. ~90% is
   a condensed restatement of facts already in (1) and is handled by the dedup rule. It uniquely
   contributes:
   - A **"★ Watch These"** section: three concepts Shweta flagged as shaky — trapezoid area
     (why the *average* of parallel sides), why AND multiplies for independent events, and
     continuous uniform as *area not 1/n*. These get `starred: true` (see below).
   - A handful of **refinements** absent from (1): ÷5 remainder trick (unit 0–4 → that digit,
     5–9 → digit−5); **volume** ratio of similar solids = (side ratio)³ (notes had only area
     ratio); z-score bell slices 34% / 13.5% / 2.5% per band and z=+2 → ~97.5th; permutation
     vs combination keyword cues (arrange/rank/seat → P; group/select/team → C); mutually-
     exclusive vs independent diagnostic ("can both happen?" / "does one affect the other?");
     interior + exterior angle = 180° per corner. These fold in as normal flashcards/formulas.

## Background

`src/data/content.json` is the single content source. `src/lib/content.js` derives everything
else from it (topic chips, sidebar, dashboard counts, global search index, formula sections),
all keyed off `topics` array order. The current deck is a tight curated slice: ~6 flashcards,
4–5 quizzes, and 7–15 formulas per topic (42 flashcards total).

`card_id` values in `flashcards` are the **primary key in the Supabase `card_reviews` table**.
Renumbering or removing an existing id orphans saved review progress.

## Decisions (locked)

1. **Scope:** Full deck — every Q&A in the PDF becomes a flashcard.
2. **Topics:** Add two new topics, taking the set from 7 → 9.
3. **Modes:** Expand all three — flashcards 1:1 with the notes, formulas extracted, quizzes
   derived with crafted distractors — across all 9 topics.
4. **Build approach:** Author directly, topic by topic, followed by a whole-file verification
   pass. No multi-agent fan-out (avoids LaTeX/style/math drift).
5. **Watch-These traps:** Capture via an additive `starred: true` field on the relevant cards
   (data only). No "Watch These" UI view in this change; it becomes a small follow-up.

## Data model changes

### New topics (appended to `topics`, existing 7 untouched)

```json
{ "id": "data-interpretation", "name": "Data Interpretation", "color": "#B5667E", "wash": "#F7E6EC" }
{ "id": "test-strategy",       "name": "Test Strategy",       "color": "#7A7196", "wash": "#ECEAF2" }
```

- Rose (`#B5667E`) and plum-grey (`#7A7196`) are distinct from the existing palette
  (orange/blue/teal/brown/purple/green/gold).
- Appended last → they appear last everywhere automatically (no app-logic change).

### ID scheme

- Prefixes: `np` Number Properties, `al` Algebra, `ge` Geometry, `co` Counting,
  `pr` Probability, `st` Statistics, `wp` Word Problems, `di` Data Interpretation,
  `ts` Test Strategy.
- Type segments: `fc` flashcard, `qz` quiz, `fm` formula. Pattern: `<topic>-<type>-<n>`.
- **Existing entries are kept byte-for-byte (same id, same content).**
- New entries continue each topic's existing sequence (e.g. new Number Properties flashcards
  start at `np-fc-7`). New topics start at `-1`.

### `starred` field

Add an optional `"starred": true` field to flashcards covering the three "★ Watch These"
concepts (mapped to their home topics: trapezoid area → Geometry, AND-multiplies → Probability,
continuous uniform → Statistics). The field is purely additive — the Flashcards screen reads
cards by `id`/`topic` and ignores unknown fields. A future "Watch These" filter would mirror the
existing `markedOnly` filter in `Flashcards.jsx`.

### Dedup rule

Where a Q&A restates a concept already present in the app (e.g. number of factors of pᵃqᵇ,
trailing zeros in n!, quadratic formula), keep the existing entry and skip the duplicate. The
same rule deduplicates the Burn-In sheet against both the existing app content and the Complete
Notes — only its unique refinements and the starred Watch-These cards are added. No near-
duplicate pairs. Applies to flashcards, quizzes, and formulas.

## Topic mapping (PDF → app topic)

| PDF source | App topic |
|---|---|
| §1 Number Properties & Sets; §2 Factors/Multiples/Divisibility | Number Properties |
| Extras: "A few more facts" (sums, primes, squares, neg powers); Absolute value & number line | Number Properties |
| §3 Exponents/identities/quadratics/inequalities; §4 Sequences & Series | Algebra |
| §5 Coordinate Geometry; §6 Geometry (triangles, polygons, circles, solids) | Geometry |
| §8 counting half (perms, combos, circular, handshakes, overlapping sets) | Counting |
| §8 probability half; Extras: Probability shortcuts | Probability |
| §7 Statistics (incl. quartiles, percentiles, distributions) | Statistics |
| Extras: Ratios & proportions, advanced Percents, Rates (speed/distance/work); §3 interest & mixture | Word Problems |
| Extras: Data Interpretation | Data Interpretation |
| Extras: GRE Strategy (QC, plug-in, back-solve, numeric entry, multi-answer, calculator) | Test Strategy |

Consequence: Number Properties is the largest topic (~50 cards); Data Interpretation (~4) and
Test Strategy (~9) are small. This reflects the notes and is acceptable.

## Per-mode generation rules

### Flashcards — 1:1 with the notes

Every PDF Q&A → one flashcard object:
- `front`: the question, with cleaned typography (e.g. `pᵃ × qᵇ`, proper minus signs).
- `answer`: the answer text from the notes.
- `latex`: included **only when there is a clean formula** for the card; conceptual cards
  (e.g. "What are integers?") omit `latex`. The Flashcards screen already renders cards both
  with and without `latex`.

### Formulas — extract every genuine formula

Walk the notes; pull every formula-bearing fact into `formulas` as `{ id, topic, label, latex }`,
deduped against the existing ~60. Concept-only Q&As produce no formula. Estimated ~30–40 new
entries (e.g. point-slope form, reflection/rotation maps, sector proportion, round-trip average
speed, combined work rate, binomial probability, percentile rank, sum of first n integers).

### Quizzes — crafted subset (not 1:1)

Multiple-choice requires plausible distractors, so quizzes are selected from the most testable
facts rather than every Q&A. Target **~6 per topic** (~50 total). Each quiz:
`{ id, topic, question | questionLatex, options[4], correct, explanation }`, matching the
existing format (use `questionLatex` when math renders better). New topics: DI ~3, Strategy ~4.

## Verification pass (before declaring done)

1. File parses as valid JSON; every entry has the required fields for its type.
2. Every `latex` and `questionLatex` string renders under KaTeX — scripted check using the
   app's existing KaTeX dependency.
3. Math spot-check; confirm each quiz `correct` index points at the correct option.
4. Diff existing entries against the prior file to confirm no id was renumbered or content
   altered.
5. App boots and the two new topics render across all three modes.
6. The three starred cards are present and carry `"starred": true`.

## Out of scope

- No changes to app logic, screens, components, Supabase schema, or styling beyond the two new
  topic color tokens (which are data, not code).
- No reordering or rewording of existing entries.
- The source PDFs live outside the repo; `content.json` remains the source of truth. The
  `_note` field's mention of `quant-notes.md` will be updated to reference both PDFs.
- No "Watch These" UI view is built in this change (the `starred` field is data-only); it is a
  deliberate future follow-up.
