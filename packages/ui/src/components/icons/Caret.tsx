import { useSporeColors } from '@universe/mycelium'
import { memo } from 'react'
import { withAnimated } from 'ui/src/components/factories/animated'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { resolveIconColor } from 'ui/src/components/factories/iconTokens'
import { ArrowChange } from 'ui/src/components/icons/ArrowChange'
import { IconSizeTokens } from 'ui/src/theme'

type Props = {
  size?: IconSizeTokens
  direction?: 'n' | 's'
  color?: string
}

export function _Caret({ size = '$icon.24', color = '$black', direction = 'n' }: Props): JSX.Element {
  const colors = useSporeColors()

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

  // Delegate to the icon factory's own resolver rather than reimplementing it: it resolves
  // theme tokens through `.val`, falls back to the raw Spore palette for theme-invariant
  // tokens like `$black`, and passes non-token values through. A literal is what has to leave
  // this wrapper, because react-native-web and React Native both discard `var(--token)` as an
  // invalid color and would leave the glyph unpainted.
  // Not memoized: it is two map lookups, and a memo keyed on the theme map would tie this to
  // that map's identity changing per theme rather than to anything local to this file.
  const resolvedColor = resolveIconColor(color, colors)

  return <ArrowChange color={resolvedColor as IconProps['color']} size={size} strokeWidth={2} rotate={degree} />
}

export const Caret = memo(_Caret)

export const AnimatedCaretChange = withAnimated(ArrowChange)
