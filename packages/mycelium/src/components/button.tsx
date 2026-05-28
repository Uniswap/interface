import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import * as React from 'react'
import { cn } from '../cn'
import { Spinner } from './spinner'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-3 whitespace-nowrap text-button-1 font-baselMedium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:[&_*]:text-inherit cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-surface1 shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-surface3 bg-transparent text-neutral1 hover:bg-surface2/50',
        secondary:
          'border-0 border-surface3 bg-surface2 text-neutral1 hover:bg-surface3 disabled:text-neutral3 disabled:opacity-100',
        tertiary:
          'border-0 bg-surface3 text-neutral1 hover:bg-black/[0.12] dark:hover:bg-white/20 disabled:text-neutral3 disabled:opacity-100',
        'tertiary-neutral':
          'border border-surface3 bg-surface1 text-neutral1 hover:bg-surface2 disabled:text-neutral3 disabled:opacity-100',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4',
        accent:
          'border-0 bg-accent1 text-white hover:bg-[#E500A5] disabled:bg-surface2 disabled:text-neutral3 disabled:opacity-100',
        'accent-link': 'bg-transparent text-accent1 hover:text-accent1/80',
        critical:
          'border-0 bg-critical text-white hover:bg-critical/90 disabled:bg-surface2 disabled:text-neutral3 disabled:opacity-100',
      },
      size: {
        default: 'h-14 rounded-[20px] px-5 py-4',
        md: 'h-12 rounded-[16px] px-4 py-3 text-button-2',
        sm: 'h-10 rounded-12 px-4 py-2 text-button-3',
        lg: 'h-16 rounded-[20px] px-8 py-5',
        icon: 'h-14 w-14 rounded-12',
        none: 'h-auto p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonState = 'idle' | 'loading' | 'success'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Visual state of the button. 'loading' shows spinner, 'success' shows checkmark. Both disable the button. */
  state?: ButtonState
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, state = 'idle', children, ...props }, ref) => {
    const isLoading = state === 'loading'
    const isSuccess = state === 'success'
    const showIndicator = state !== 'idle'

    // When showing indicator, always render as button (not Slot) to support indicator icons
    // Also, if asChild is true, we can't use Slot with multiple children
    const useSlot = asChild && !showIndicator && React.Children.count(children) === 1
    const Comp = useSlot ? Slot : 'button'

    const content = (
      <>
        <span className="button-loading-text inline-flex items-center gap-2" data-loading={showIndicator || undefined}>
          {children}
        </span>
        <span
          className="button-state-spinner absolute inset-0 flex items-center justify-center"
          data-visible={isLoading || undefined}
        >
          <Spinner className="size-4" />
        </span>
        <span
          className="button-state-success absolute inset-0 flex items-center justify-center"
          data-visible={isSuccess || undefined}
        >
          <Check className="size-4" />
        </span>
      </>
    )

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={showIndicator || props.disabled}
        {...props}
      >
        {useSlot ? children : content}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
