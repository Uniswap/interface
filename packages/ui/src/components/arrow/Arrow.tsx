import { useSporeColors } from '@universe/mycelium'
import { memo } from 'react'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { resolveIconColor } from 'ui/src/components/factories/iconTokens'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'

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
  const colors = useSporeColors()

  // Delegate to the icon factory's own resolver rather than reimplementing it: it resolves
  // theme tokens through `.val`, falls back to the raw Spore palette for theme-invariant
  // tokens like `$black`, and passes non-token values through. A literal is what has to leave
  // this wrapper, because react-native-web and React Native both discard `var(--token)` as an
  // invalid color and would leave the glyph unpainted.
  // Not memoized: it is two map lookups, and a memo keyed on the theme map would tie this to
  // that map's identity changing per theme rather than to anything local to this file.
  const resolvedColor = resolveIconColor(color, colors)

  return (
    <ArrowDown
      color={resolvedColor as IconProps['color']}
      rotateZ={DIRECTION_TO_DEGREE[direction]}
      size={size}
      strokeWidth={2}
    />
  )
}

export const Arrow = memo(ArrowIcon)
