import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '../cn'

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  variant?: 'default' | 'neutral'
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'grid place-content-center peer size-[20px] shrink-0 rounded-[4px] border border-neutral3 bg-surface2 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'default' && 'data-[state=checked]:bg-accent1 data-[state=checked]:border-accent1',
        variant === 'neutral' && 'data-[state=checked]:bg-neutral1 data-[state=checked]:border-neutral1',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          'grid place-content-center',
          variant === 'default' && 'text-white',
          variant === 'neutral' && 'text-surface1',
        )}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  ),
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export type { CheckboxProps }
export { Checkbox }
