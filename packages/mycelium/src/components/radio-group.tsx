import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import * as React from 'react'
import { cn } from '../cn'

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  variant?: 'default' | 'neutral'
}

const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          'grid place-content-center size-[18px] rounded-full border border-surface3 bg-surface2 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'default' && 'data-[state=checked]:border-accent1 data-[state=checked]:bg-accent1',
          variant === 'neutral' && 'data-[state=checked]:border-neutral1 data-[state=checked]:bg-neutral1',
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          className={cn(
            'flex items-center justify-center',
            variant === 'default' && 'text-white',
            variant === 'neutral' && 'text-surface1',
          )}
        >
          <Circle className="size-2 fill-current" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    )
  },
)
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export type { RadioGroupItemProps }
export { RadioGroup, RadioGroupItem }
