import { ArrowDown } from '@universe/mycelium/icons/ArrowDown'
import { memo } from 'react'

type Direction = 'n' | 'e' | 's' | 'w' | 'ne' | 'se'

type Props = {
  size?: number
  direction?: Direction
  color?: string
}

const DIRECTION_TO_DEGREE: Record<Direction, `${number}deg`> = {
  s: '0deg',
  w: '90deg',
  n: '180deg',
  ne: '225deg',
  e: '270deg',
  se: '315deg',
}

export function ArrowIcon({ size = 24, color = '#000000', direction = 'e' }: Props): JSX.Element {
  return <ArrowDown color={color} rotate={DIRECTION_TO_DEGREE[direction]} size={size} strokeWidth={2} />
}

export const Arrow = memo(ArrowIcon)
