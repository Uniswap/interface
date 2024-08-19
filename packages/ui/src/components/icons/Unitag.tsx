import { memo } from 'react'
import { Image } from 'tamagui'
import { UNITAG_DARK, UNITAG_DARK_SMALL, UNITAG_LIGHT, UNITAG_LIGHT_SMALL } from 'ui/src/assets'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { isMobileApp } from 'utilities/src/platform'

function _Unitag(props: IconProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  return isDarkMode ? (
    <Image height={props.size} source={isMobileApp ? UNITAG_DARK : UNITAG_DARK_SMALL} width={props.size} />
  ) : (
    <Image height={props.size} source={isMobileApp ? UNITAG_LIGHT : UNITAG_LIGHT_SMALL} width={props.size} />
  )
}

export const Unitag = memo(_Unitag)
