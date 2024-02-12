import { memo } from 'react'
import { Image } from 'tamagui'
import { UNITAG_DARK, UNITAG_LIGHT } from 'ui/src/assets'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'

function _Unitag(props: IconProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  return isDarkMode ? (
    <Image height={props.size} source={UNITAG_DARK} width={props.size} />
  ) : (
    <Image height={props.size} source={UNITAG_LIGHT} width={props.size} />
  )
}

export const Unitag = memo(_Unitag)
