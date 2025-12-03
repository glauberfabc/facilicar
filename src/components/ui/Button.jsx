import { cn } from '../../lib/utils'

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'bg-transparent hover:bg-dark-lighter text-white px-4 py-2 rounded-lg transition-all',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-lg transition-all',
}

export const Button = ({
  children,
  variant = 'primary',
  className,
  ...props
}) => {
  return (
    <button
      className={cn(buttonVariants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
