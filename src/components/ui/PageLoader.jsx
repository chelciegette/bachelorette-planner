import { Spinner } from './icons'

export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center px-4" role="status">
      <div className="flex animate-fade-in items-center gap-3 text-plum-500">
        <Spinner className="size-5 text-berry-500" />
        <span className="font-display text-2xl">{label}</span>
      </div>
    </div>
  )
}
