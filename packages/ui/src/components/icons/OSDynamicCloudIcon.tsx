import { useSporeColors } from '@universe/mycelium'
import { memo } from 'react'
import { Platform } from 'react-native'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { resolveIconColor } from 'ui/src/components/factories/iconTokens'
import { Cloud, GoogleDrive } from 'ui/src/components/icons'

function _OSDynamicCloudIcon({ color, ...rest }: IconProps): JSX.Element {
  const colors = useSporeColors()

  // Delegate to the icon factory's own resolver rather than reimplementing it: it resolves
  // theme tokens through `.val`, falls back to the raw Spore palette for theme-invariant
  // tokens like `$black`, and passes non-token values through. A literal is what has to leave
  // this wrapper, because react-native-web and React Native both discard `var(--token)` as an
  // invalid color and would leave the glyph unpainted.
  // Not memoized: it is two map lookups, and a memo keyed on the theme map would tie this to
  // that map's identity changing per theme rather than to anything local to this file.
  const resolvedColor = resolveIconColor(color, colors)

  const iconProps: IconProps = { ...rest, color: resolvedColor as IconProps['color'] }

  if (Platform.OS === 'ios') {
    return <Cloud {...iconProps} />
  } else {
    return <GoogleDrive {...iconProps} />
  }
}

export const OSDynamicCloudIcon = memo(_OSDynamicCloudIcon)
