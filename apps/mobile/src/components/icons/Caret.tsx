import React, { memo } from 'react'
import { useAppTheme } from 'src/app/hooks'
import CaretChange from 'ui/src/assets/icons/arrow-change.svg'
import { withAnimated } from 'ui/src/components/factories/animated'

type Props = {
  size?: number
  direction?: 'n' | 's'
  color?: string
}

export function _Caret({ size = 24, color, direction = 'n' }: Props): JSX.Element {
  const theme = useAppTheme()
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
    <CaretChange
      color={color ?? theme.colors.sporeBlack}
      height={size}
      strokeWidth={2}
      style={{ transform: [{ rotate: degree }] }}
      width={size}
    />
  )
}

export const Caret = memo(_Caret)

export const AnimatedCaretChange = withAnimated(CaretChange)
