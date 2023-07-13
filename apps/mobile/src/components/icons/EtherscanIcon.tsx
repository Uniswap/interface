import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import { Logos } from 'ui/src'

export function EtherscanIcon({ width, height }: SvgProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  return isDarkMode ? (
    <Logos.EtherscanLogoDark height={height} width={width} />
  ) : (
    <Logos.EtherscanLogoLight height={height} width={width} />
  )
}
