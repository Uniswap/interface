import { forwardRef, type ForwardedRef, type ForwardRefExoticComponent, type JSX, type RefAttributes } from 'react'
import { ButtonFrameCompat } from '../button-frame-compat/ButtonFrameCompat'
import {
  DROPDOWN_FRAME_BASE_CLASSES,
  DROPDOWN_FRAME_EXPANDED_CLASSES,
  type ButtonEmphasis,
} from '../button-frame-compat/compile'
import type { ButtonFrameCompatProps } from '../button-frame-compat/props'
import { cn } from '../cn'

/**
 * The dropdown frame: the default-variant `ButtonFrameCompat` with `justify-between`, and the
 * secondary/tertiary/text-only emphases repainted transparent while `isExpanded` (secondary keeps a
 * `$surface3` border). The class tables go on `className` so they win the merge after the closed
 * variant cell, the precedence the legacy `styled()` extension had.
 */
export type DropdownButtonFrameProps = ButtonFrameCompatProps & {
  isExpanded?: boolean
  // Required: it keys DROPDOWN_FRAME_EXPANDED_CLASSES, and a local default could drift from
  // DropdownButtonCompat's ('secondary').
  emphasis: ButtonEmphasis
}

function DropdownButtonFrameComponent(
  { isExpanded, emphasis, className, ...props }: DropdownButtonFrameProps,
  ref: ForwardedRef<HTMLElement>,
): JSX.Element {
  return (
    <ButtonFrameCompat
      ref={ref}
      variant="default"
      emphasis={emphasis}
      className={cn(
        DROPDOWN_FRAME_BASE_CLASSES,
        isExpanded ? DROPDOWN_FRAME_EXPANDED_CLASSES[emphasis] : undefined,
        className,
      )}
      {...props}
    />
  )
}

// Explicit annotation: the inferred type names mycelium-internal prop types (TS2883 under declaration emit).
export const DropdownButtonFrame: ForwardRefExoticComponent<DropdownButtonFrameProps & RefAttributes<HTMLElement>> =
  forwardRef(DropdownButtonFrameComponent)

DropdownButtonFrame.displayName = 'DropdownButtonFrame'
