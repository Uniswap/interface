import React from 'react'
import { SvgProps } from 'react-native-svg'
import { IconProps, Logos } from 'ui/src'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

export function EtherscanIcon({ size }: SvgProps & { size?: IconProps['size'] }): JSX.Element {
  const isDarkMode = useIsDarkMode()

  return isDarkMode ? (
    <Logos.EtherscanLogoDark size={size} />
  ) : (
    <Logos.EtherscanLogoLight size={size} />
  )
}
