import React from 'react'
import { useColorScheme } from 'react-native'
import EtherscanLogoDark from 'src/assets/logos/etherscan-logo-dark.svg'
import EtherscanLogoLight from 'src/assets/logos/etherscan-logo-light.svg'

type Props = {
  size: number
}

export function EtherscanIcon({ size }: Props): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark'

  return isDarkMode ? (
    <EtherscanLogoDark height={size} width={size} />
  ) : (
    <EtherscanLogoLight height={size} width={size} />
  )
}
