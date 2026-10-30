import {
  ButtonTextCompat,
  DROPDOWN_TEXT_EXPANDED_CLASSES,
  type ButtonTextCompatProps,
} from '@universe/mycelium/button-frame-compat'
import { cn } from '@universe/mycelium/cn'
import { forwardRef, type ForwardedRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

/**
 * Rebuilt `DropdownButtonText` (INFRA-3285): legacy `styled(CustomButtonText, …)`
 * repainted the label `$neutral2`/`$neutral2Hovered` (own hover AND the frame's
 * group hover) while `isExpanded`. `DROPDOWN_TEXT_EXPANDED_CLASSES` (from
 * `@universe/mycelium/button-frame-compat`) is the literal class table for that
 * delta, keyed to the `group/sbtn` marker `ButtonFrameCompat` puts on the frame
 * element - no manual hover-state plumbing needed on web. Composed onto
 * `ButtonTextCompat`'s `className` escape hatch so it wins the merge after the
 * closed cell.
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

// Explicit annotation: see DropdownButtonFrame.tsx for why (same TS2883 constraint).
export const DropdownButtonText: ForwardRefExoticComponent<DropdownButtonTextProps & RefAttributes<HTMLSpanElement>> =
  forwardRef(DropdownButtonTextComponent)

DropdownButtonText.displayName = 'DropdownButtonText'
