import { memo } from 'react'
import { Icons } from 'ui/src'
import { withAnimated } from 'ui/src/components/factories/animated'

type Props = {
  size?: number
  direction?: 'n' | 's'
  color?: string
}

export function _Caret({ size = 24, color, direction = 'n' }: Props): JSX.Element {
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

  return (
    <Icons.ArrowChange
      color={color ?? '$sporeBlack'}
      height={size}
      strokeWidth={2}
      style={{ transform: [{ rotate: degree }] }}
      width={size}
    />
  )
}

export const Caret = memo(_Caret)

export const AnimatedCaretChange = withAnimated(Icons.ArrowChange)
