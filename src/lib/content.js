import data from '../data/content.json'

export const topics = data.topics
export const flashcards = data.flashcards
export const quizzes = data.quizzes
export const formulas = data.formulas

export const topicByName = Object.fromEntries(topics.map((t) => [t.name, t]))

export function topicColor(name) {
  return topicByName[name]?.color || '#46417B'
}
export function topicWash(name) {
  return topicByName[name]?.wash || '#F8F6FC'
}

// Formula sections grouped by topic, in topic order.
export const formulaSections = topics
  .map((t) => ({
    key: t.id,
    name: t.name,
    color: t.color,
    items: formulas.filter((f) => f.topic === t.name),
  }))
  .filter((s) => s.items.length > 0)

// Per-topic counts for dashboard / chips.
export function countsFor(name) {
  return {
    cards: flashcards.filter((c) => c.topic === name).length,
    quizzes: quizzes.filter((q) => q.topic === name).length,
    formulas: formulas.filter((f) => f.topic === name).length,
  }
}

export const totals = {
  cards: flashcards.length,
  quizzes: quizzes.length,
  formulas: formulas.length,
  topics: topics.length,
}

// Unified global search index over formulas + flashcards.
export const searchIndex = [
  ...formulas.map((f) => ({
    id: f.id,
    label: f.label,
    sub: `${f.topic} · Formula`,
    screen: 'formulas',
    topic: f.topic,
    glyph: '√',
  })),
  ...flashcards.map((c) => ({
    id: c.id,
    label: c.front.replace(/\s*—.*$/, '').replace(/\?$/, ''),
    sub: `${c.topic} · Flashcard`,
    screen: 'cards',
    topic: c.topic,
    glyph: 'n',
  })),
]

export function searchAll(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return searchIndex
    .filter((r) => r.label.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q))
    .slice(0, 6)
}
