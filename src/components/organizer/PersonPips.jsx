/**
 * One small bar per bridesmaid — green if she can come, pink if not. People are
 * always in the same order (alphabetical), so a column lines up with the same
 * person on every row, making patterns easy to spot.
 */
export default function PersonPips({ people, stat, className = '' }) {
  return (
    <span
      className={`flex gap-0.5 ${className}`}
      role="img"
      aria-label={`${stat.availableCount} of ${stat.total} can attend`}
    >
      {people.map((person) => {
        const out = stat.unavailableIds.has(person.id)
        return (
          <span
            key={person.id}
            title={`${person.name}: ${out ? 'can’t attend' : 'can attend'}`}
            className={`h-2 min-w-1 flex-1 rounded-full ${out ? 'bg-blush-300' : 'bg-sage-500'}`}
          />
        )
      })}
    </span>
  )
}
