// Heatmap colour scale: rose (few can come) → champagne → sage (everyone).
// Text colours are chosen so labels stay readable on every step.

const INK = '#2f1d27'

export const HEAT_LEVELS = [
  { key: 'everyone', label: 'Everyone', min: 1, bg: '#3f7a5d', fg: '#ffffff' },
  { key: 'high', label: '85%+', min: 0.85, bg: '#8fc3a6', fg: INK },
  { key: 'good', label: '70%+', min: 0.7, bg: '#c8e1cd', fg: INK },
  { key: 'some', label: '55%+', min: 0.55, bg: '#f4e6bd', fg: INK },
  { key: 'few', label: '40%+', min: 0.4, bg: '#f8d3cd', fg: INK },
  { key: 'low', label: 'Under 40%', min: 0, bg: '#ec9fb0', fg: INK },
]

export const EMPTY_HEAT = { key: 'none', label: 'No responses', min: 0, bg: '#ffffff', fg: INK }

export function heatLevel(availableCount, total) {
  if (!total) return EMPTY_HEAT
  if (availableCount >= total) return HEAT_LEVELS[0]
  const ratio = availableCount / total
  return HEAT_LEVELS.find((level) => ratio >= level.min - 1e-9) ?? HEAT_LEVELS[HEAT_LEVELS.length - 1]
}
