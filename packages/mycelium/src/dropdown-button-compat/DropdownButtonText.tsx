import { forwardRef, type ForwardedRef, type ForwardRefExoticComponent, type JSX, type RefAttributes } from 'react'
import { ButtonTextCompat } from '../button-frame-compat/ButtonTextCompat'
import { DROPDOWN_TEXT_EXPANDED_CLASSES } from '../button-frame-compat/compile'
import type { ButtonTextCompatProps } from '../button-frame-compat/text-props'
import { cn } from '../cn'

/**
 * The dropdown label: repainted `$neutral2` (and its hovered twin, on its own hover and the frame's
 * `group/sbtn` hover) while `isExpanded`. Composed onto `className` so it wins after the closed cell.
 */
export type DropdownButtonTextProps = ButtonTextCompatProps & {
  isExpanded?: boolean
}

function DropdownButtonTextComponent(
  { isExpanded, className, ...props }: DropdownButtonTextProps,
  ref: ForwardedRef<HTMLSpanElement>,
): JSX.Element {
  return (
    <ButtonTextCompat
      ref={ref}
      className={cn(isExpanded ? DROPDOWN_TEXT_EXPANDED_CLASSES : undefined, className)}
      {...props}
    />
  )
}

// Explicit annotation: see DropdownButtonFrame.tsx (same TS2883 constraint).
export const DropdownButtonText: ForwardRefExoticComponent<DropdownButtonTextProps & RefAttributes<HTMLSpanElement>> =
  forwardRef(DropdownButtonTextComponent)

DropdownButtonText.displayName = 'DropdownButtonText'
