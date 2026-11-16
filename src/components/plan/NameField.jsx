import { CARD } from '../ui/styles'
import StepHeading from './StepHeading'

export default function NameField({ value, onChange, inputRef, invalid, shake, onShakeEnd, children }) {
  return (
    // The entrance animation lives on the outer card and the shake on an inner
    // wrapper, so ending the shake never replays the fade-in.
    <section className={`${CARD} scroll-mt-6 animate-fade-up`} style={{ animationDelay: '220ms' }}>
      <div
        className={`p-5 sm:p-6 ${shake ? 'animate-shake' : ''}`}
        onAnimationEnd={(event) => {
          if (event.animationName === 'shake') onShakeEnd()
        }}
      >
        <StepHeading number={1}>Your name</StepHeading>
        <label htmlFor="bridesmaid-name" className="sr-only">
          Your name
        </label>
        <input
          id="bridesmaid-name"
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="text"
          name="name"
          autoComplete="name"
          maxLength={40}
          placeholder="First name & last initial"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? 'bridesmaid-name-problem' : undefined}
          className={`h-14 w-full rounded-2xl bg-white px-5 text-lg text-plum-900 outline-none ring-1 ring-inset transition placeholder:text-plum-300 focus:ring-2 focus:ring-berry-500 ${
            invalid ? 'ring-berry-500' : 'ring-blush-300'
          }`}
        />
        {children}
      </div>
    </section>
  )
}
