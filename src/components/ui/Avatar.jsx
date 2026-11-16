import { initials, toneFor } from '../../lib/people'

const SIZES = {
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-11 text-sm',
}

export default function Avatar({ name, size = 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-wide ${SIZES[size]} ${toneFor(name)}`}
    >
      {initials(name)}
    </span>
  )
}
