import { memo } from 'react'
import type { CSSProperties, HTMLAttributes, ReactElement } from 'react'
import { Flex } from '../flex'
import { Chevron } from './Chevron'

type Props = {
  size?: number | string
  direction?: 'up' | 'right' | 'down' | 'left' | 'start' | 'end'
  color?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'color'>

function isRTL(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
}

function getDegree(direction: NonNullable<Props['direction']>): string {
  switch (direction) {
    case 'start':
      return isRTL() ? '180deg' : '0deg'
    case 'end':
      return isRTL() ? '0deg' : '180deg'
    case 'up':
      return '90deg'
    case 'right':
      return '180deg'
    case 'down':
      return '270deg'
    case 'left':
    default:
      return '0deg'
  }
}

function RotatableChevronIcon({ color, size = 24, direction = 'start', style, ...rest }: Props): ReactElement {
  const wrapperStyle: CSSProperties = {
    borderRadius: 999999,
    transform: `rotate(${getDegree(direction)})`,
    // Mirrors the legacy `animation="fast"` rotate transition.
    transition: 'transform 150ms ease-in-out',
    ...style,
  }

  return (
    <Flex direction="column" align="center" justify="center" style={wrapperStyle} {...rest}>
      <Chevron color={color} size={size} />
    </Flex>
  )
}
export const RotatableChevron = memo(RotatableChevronIcon)
