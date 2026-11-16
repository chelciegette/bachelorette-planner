// A tiny inline icon set (24px grid, 1.8 stroke) so there are no icon dependencies.

const stroke = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const CheckIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

export const CloseIcon = (props) => (
  <svg {...stroke} strokeWidth={2.2} {...props}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
)

export const CopyIcon = (props) => (
  <svg {...stroke} {...props}>
    <rect x="9" y="9" width="11" height="11" rx="3" />
    <path d="M15 9V7a3 3 0 00-3-3H7a3 3 0 00-3 3v5a3 3 0 003 3h2" />
  </svg>
)

export const LinkIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 00-5.7 0l-3 3A4 4 0 0011 18.7l1-1" />
  </svg>
)

export const ChevronLeftIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M14.5 6l-6 6 6 6" />
  </svg>
)

export const ChevronRightIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M9.5 6l6 6-6 6" />
  </svg>
)

export const ChevronDownIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
)

export const ArrowDownIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)

export const TrashIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M4 7h16M9.5 7V5a1 1 0 011-1h3a1 1 0 011 1v2M6.5 7l.8 11a2 2 0 002 1.9h5.4a2 2 0 002-1.9l.8-11" />
  </svg>
)

export const PencilIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M4 20l1-4L16.5 4.5a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8 19z" />
  </svg>
)

export const LockIcon = (props) => (
  <svg {...stroke} {...props}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="3" />
    <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" />
  </svg>
)

export const HeartIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.700 3.700 4.500 7 4.500c2 0 3.400 1.100 5 3 1.600-1.900 3-3 5-3 3.300 0 5.400 3.200 4.200 6.600-1.700 4.800-9.200 9.400-9.200 9.400z" />
  </svg>
)

/** Four-point sparkle, filled. */
export const SparkleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 1.5l2.200 7.300L21.500 11l-7.300 2.200L12 20.500l-2.200-7.300L2.500 11l7.300-2.200z" />
  </svg>
)

export const UsersIcon = (props) => (
  <svg {...stroke} {...props}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.500 19.500c.5-3.400 3-5.500 6.500-5.500s6 2.100 6.500 5.500" />
    <path d="M16 5.200a3.500 3.500 0 010 6.600M18.500 14.500c1.800.7 2.800 2.300 3 5" />
  </svg>
)

export const RefreshIcon = (props) => (
  <svg {...stroke} {...props}>
    <path d="M4 12a8 8 0 0113.7-5.600L20 8.500M20 4v4.500h-4.500M20 12a8 8 0 01-13.700 5.600L4 15.500M4 20v-4.500h4.500" />
  </svg>
)

export const Spinner = (props) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin-slow" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)
