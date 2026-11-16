/** The day numbers inside a weekend cell, lined up with the weekday columns above. */
export default function SegmentDays({ cells, className = '' }) {
  return (
    <span className={`grid w-full tabular-nums ${className}`} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((cell) => (
        <span key={cell.iso} className={cell.inMonth ? '' : 'opacity-50'}>
          {cell.day}
        </span>
      ))}
    </span>
  )
}
