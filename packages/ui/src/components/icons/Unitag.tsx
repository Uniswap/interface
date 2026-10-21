import { isMobileApp, isWebApp } from '@universe/environment'
import { UNITAG_DARK, UNITAG_DARK_SMALL, UNITAG_LIGHT, UNITAG_LIGHT_SMALL } from '@universe/mycelium/assets'
import { UniversalImage, UniversalImageStyleProps } from '@universe/mycelium/universal-image'
import { memo, useMemo } from 'react'
import { ICON_SIZE_TOKEN_PX } from 'ui/src/components/factories/iconTokens'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { IconSizeTokens } from 'ui/src/theme'

const style: UniversalImageStyleProps = {
  image: {
    verticalAlign: 'sub',
  },
}

function UnitagIcon({ size = '$icon.24' }: { size: IconSizeTokens | number }): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const sizeNumber = typeof size === 'number' ? size : ICON_SIZE_TOKEN_PX[size]
  const universalImageSize = useMemo(() => ({ height: sizeNumber, width: sizeNumber }), [sizeNumber])

  const uri = useMemo(() => {
    if (isDarkMode) {
      return isMobileApp ? UNITAG_DARK : UNITAG_DARK_SMALL
    }
    return isMobileApp ? UNITAG_LIGHT : UNITAG_LIGHT_SMALL
  }, [isDarkMode])

  if (isWebApp) {
    return <img src={uri} width={universalImageSize.width} height={universalImageSize.height} style={style.image} />
  } else {
    return <UniversalImage allowLocalUri style={style} size={universalImageSize} uri={uri} />
  }
}

export const Unitag = memo(UnitagIcon)
