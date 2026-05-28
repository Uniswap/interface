import * as React from 'react'
import { cn } from '../cn'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-14 w-full rounded-[20px] border border-surface3 bg-surface2 px-5 py-2 text-body-2 font-baselBook text-neutral1 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-neutral2 group-has-[[data-slot=field-label]]/field:placeholder:text-neutral3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-surface3 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
