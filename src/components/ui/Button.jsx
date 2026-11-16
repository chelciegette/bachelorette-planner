const VARIANTS = {
  primary:
    'bg-linear-to-br from-berry-500 to-berry-600 text-white shadow-berry hover:brightness-110 hover:-translate-y-px',
  soft: 'bg-blush-100 text-berry-700 hover:bg-blush-200',
  outline: 'bg-white text-plum-900 ring-1 ring-inset ring-blush-300 hover:bg-blush-50',
  ghost: 'text-plum-700 hover:bg-blush-100',
  danger: 'bg-berry-600 text-white hover:bg-berry-700',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-8 text-base',
}

export default function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={[
        'inline-flex select-none items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap',
        'transition duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...props}
    />
  )
}
