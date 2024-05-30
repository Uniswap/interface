import { memo } from 'react'
import ArrowDown from 'ui/src/assets/icons/arrow-down.svg'

type Props = {
  size?: number
  direction?: 'n' | 'e' | 's' | 'w' | 'ne' | 'se'
  color?: string
}

export function _Arrow({ size = 24, color = '#000000', direction = 'e' }: Props): JSX.Element {
  let degree: string
  switch (direction) {
    case 's':
      degree = '0deg'
      break
    case 'w':
      degree = '90deg'
      break
    case 'n':
      degree = '180deg'
      break
    case 'ne':
      degree = '225deg'
      break
    case 'e':
      degree = '270deg'
      break
    case 'se':
      degree = '315deg'
      break
    default:
      throw new Error(`Invalid arrow direction ${direction}`)
  }

  return (
    <ArrowDown
      color={color}
      height={size}
      strokeWidth={2}
      style={{ transform: [{ rotate: degree }] }}
      width={size}
    />
  )
}

export const Arrow = memo(_Arrow)
