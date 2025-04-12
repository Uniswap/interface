import { memo, useMemo } from 'react'
import { UniversalImageProps, getTokenValue } from 'ui/src'
import { UNITAG_DARK, UNITAG_DARK_SMALL, UNITAG_LIGHT, UNITAG_LIGHT_SMALL } from 'ui/src/assets'
import { UniversalImage } from 'ui/src/components/UniversalImage/UniversalImage'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { IconSizeTokens } from 'ui/src/theme'
import { isMobileApp } from 'utilities/src/platform'

const style: UniversalImageProps['style'] = {
  image: {
    verticalAlign: 'sub',
  },
}

function _Unitag({ size = '$icon.24' }: { size: IconSizeTokens | number }): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const sizeNumber = typeof size === 'number' ? size : getTokenValue(size)
  const universalImageSize = useMemo(() => ({ height: sizeNumber, width: sizeNumber }), [sizeNumber])

  const uri = useMemo(() => {
    if (isDarkMode) {
      return isMobileApp ? UNITAG_DARK : UNITAG_DARK_SMALL
    }
    return isMobileApp ? UNITAG_LIGHT : UNITAG_LIGHT_SMALL
  }, [isDarkMode])

  return <UniversalImage style={style} size={universalImageSize} uri={uri} allowLocalUri />
}

export const Unitag = memo(_Unitag)
