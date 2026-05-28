import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../cn'

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      default: '',
      heading: 'font-semibold tracking-tight',
      subheading: 'text-muted-foreground',
      destructive: 'text-destructive',
    },
    typography: {
      // Headings
      'heading-1': 'text-heading-1',
      'heading-2': 'text-heading-2',
      'heading-3': 'text-heading-3',
      // Subheadings
      'subheading-1': 'text-subheading-1 !font-medium',
      'subheading-2': 'text-subheading-2 !font-medium',
      // Body
      'body-1': 'text-body-1',
      'body-2': 'text-body-2',
      'body-3': 'text-body-3',
      'body-4': 'text-body-4',
      // Button Labels
      'button-1': 'text-button-1 !font-[535]',
      'button-2': 'text-button-2 !font-[535]',
      'button-3': 'text-button-3 !font-[535]',
      'button-4': 'text-button-4 !font-[535]',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm leading-normal',
      default: 'text-base leading-normal',
      lg: 'text-lg leading-normal',
      xl: 'text-xl leading-normal',
      '2xl': 'text-2xl leading-normal',
      '3xl': 'text-3xl leading-normal',
      '4xl': 'text-4xl leading-normal',
      '5xl': 'text-5xl leading-normal',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    variant: 'default',
    // size is conditionally applied - don't set default here to avoid conflicts with typography
    weight: 'normal',
    align: 'left',
  },
})

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof textVariants> {
  asChild?: boolean
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}
const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, size, weight, align, typography, as: Component = 'p', ...props }, ref) => {
    const Comp = Component as React.ElementType

    // When typography is provided, exclude size to prevent conflicts
    // Typography classes already include font size, line height, and font weight
    // When typography is not provided, use size (defaulting to 'default' if not specified)
    const variantProps = {
      variant,
      ...(typography ? {} : { size: size ?? 'default' }),
      weight,
      align,
      typography,
    }

    return <Comp ref={ref} className={cn(textVariants(variantProps), className)} {...props} />
  },
)
Text.displayName = 'Text'

export { Text, textVariants }
