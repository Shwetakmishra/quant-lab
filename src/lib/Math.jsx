import { useMemo } from 'react'
import katex from 'katex'

/**
 * Render a KaTeX/LaTeX string. `block` centers and enlarges it (for the
 * flashcard back and formula rows); inline keeps it at text size.
 */
export default function Math({ tex, block = false, className = '' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        output: 'htmlAndMathml',
        strict: false,
      })
    } catch {
      return tex
    }
  }, [tex, block])

  return (
    <span
      className={`${block ? 'math-block' : 'math-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Render a string that may contain inline math delimited by $...$, mixed with
 * plain text. Used for quiz question stems like "Discriminant of $ax^2+bx+c=0$?".
 */
export function MixedMath({ text = '', className = '' }) {
  const parts = useMemo(() => text.split(/(\$[^$]+\$)/g).filter(Boolean), [text])
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith('$') && p.endsWith('$') ? (
          <Math key={i} tex={p.slice(1, -1)} />
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  )
}
