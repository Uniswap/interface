import * as SwitchPrimitives from '@radix-ui/react-switch'
import * as React from 'react'
import { cn } from '../cn'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-surface3 bg-surface3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-accent1 data-[state=checked]:border-accent1',
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block size-3.5 rounded-full bg-surface1 border border-surface3 shadow-sm shadow-black/10 ring-0 transition-transform data-[state=checked]:translate-x-[19px] data-[state=unchecked]:translate-x-[3px] data-[state=checked]:bg-neutral-50 data-[state=checked]:border-transparent',
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
