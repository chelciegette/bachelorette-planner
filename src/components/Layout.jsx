import DemoBar from './DemoBar'
import { HeartIcon } from './ui/icons'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBar />
      <main className="flex-1">{children}</main>
      <footer className="px-4 pb-10 pt-4 text-center text-xs text-plum-500">
        Made with <HeartIcon className="mx-0.5 inline size-3 -translate-y-px text-blush-400" /> for the big weekend
      </footer>
    </div>
  )
}
