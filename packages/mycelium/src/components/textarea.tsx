import * as React from 'react'
import { cn } from '../cn'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[112px] w-full rounded-[20px] border border-surface3 bg-surface2 px-5 py-4 text-body-2 font-baselBook text-neutral1 transition-colors placeholder:text-neutral2 group-has-[[data-slot=field-label]]/field:placeholder:text-neutral3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-surface3 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
          className,
        )}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
