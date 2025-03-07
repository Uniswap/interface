import { memo } from 'react'
import { getTokenValue } from 'ui/src'
import { UNITAG_DARK, UNITAG_DARK_SMALL, UNITAG_LIGHT, UNITAG_LIGHT_SMALL } from 'ui/src/assets'
import { UniversalImage } from 'ui/src/components/UniversalImage/UniversalImage'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { IconSizeTokens } from 'ui/src/theme'
import { isMobileApp } from 'utilities/src/platform'

function _Unitag({ size = '$icon.24' }: { size: IconSizeTokens | number }): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const sizeNumber = typeof size === 'number' ? size : getTokenValue(size)
  const universalImageSize = { height: sizeNumber, width: sizeNumber }

  const getUri = () => {
    if (isDarkMode) {
      return isMobileApp ? UNITAG_DARK : UNITAG_DARK_SMALL
    }
    return isMobileApp ? UNITAG_LIGHT : UNITAG_LIGHT_SMALL
  }

  return (
    <UniversalImage
      style={{
        image: {
          verticalAlign: 'bottom',
        },
      }}
      size={universalImageSize}
      uri={getUri()}
      allowLocalUri
    />
  )
}

export const Unitag = memo(_Unitag)
