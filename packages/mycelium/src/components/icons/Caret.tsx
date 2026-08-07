import { memo } from 'react'
import type { ReactElement } from 'react'
import { ArrowChange } from './ArrowChange'

type Props = {
  size?: number | string
  direction?: 'n' | 's'
  color?: string
}

export function _Caret({ size = 24, color, direction = 'n' }: Props): ReactElement {
  let degree: string
  switch (direction) {
    case 's':
      degree = '0deg'
      break
    case 'n':
      degree = '180deg'
      break
    default:
      throw new Error(`Invalid arrow direction ${direction}`)
  }

  // Legacy `$black` is theme-invariant #000000 (sporeLight.black === sporeDark.black).
  // A literal, not `var(--color-black)`: that's a Tailwind @theme variable pruned from
  // the compiled CSS when no black utility is used, and an undefined var() in the svg
  // `color` presentation attribute degrades to the inherited text color (white in dark mode).
  return (
    <ArrowChange color={color ?? '#000000'} size={size} strokeWidth={2} style={{ transform: `rotate(${degree})` }} />
  )
}

export const Caret = memo(_Caret)

// Legacy wraps ArrowChange with reanimated; on the web animation comes from CSS,
// so the same-name export is the plain component.
export const AnimatedCaretChange = ArrowChange
