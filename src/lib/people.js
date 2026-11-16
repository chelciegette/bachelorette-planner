// Little helpers for showing a person: initials and a stable pastel avatar tone.

const TONES = [
  'bg-blush-200 text-berry-700',
  'bg-sage-100 text-sage-700',
  'bg-champagne-100 text-champagne-700',
  'bg-lilac-100 text-lilac-600',
  'bg-blush-100 text-berry-600',
  'bg-cream-200 text-plum-700',
]

export function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function toneFor(name) {
  let hash = 0
  for (const char of String(name)) hash = (hash * 31 + char.codePointAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

export const firstName = (name) => String(name).trim().split(/\s+/)[0] ?? ''
