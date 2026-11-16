export default function StepHeading({ number, children, aside }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blush-200 text-xs font-semibold text-berry-700">
        {number}
      </span>
      <h2 className="text-[1.75rem] leading-none">{children}</h2>
      {aside && <div className="ml-auto">{aside}</div>}
    </div>
  )
}
