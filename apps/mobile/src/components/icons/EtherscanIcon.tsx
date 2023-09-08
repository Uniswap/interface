import React from 'react'
import { SvgProps } from 'react-native-svg'
import { Logos } from 'ui/src'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

export function EtherscanIcon({ width, height }: SvgProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  return isDarkMode ? (
    <Logos.EtherscanLogoDark height={height} width={width} />
  ) : (
    <Logos.EtherscanLogoLight height={height} width={width} />
  )
}
