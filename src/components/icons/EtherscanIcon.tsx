import React from 'react'
import EtherscanLogoDark from 'src/assets/logos/etherscan-logo-dark.svg'
import EtherscanLogoLight from 'src/assets/logos/etherscan-logo-light.svg'
import { useIsDarkMode } from 'src/features/appearance/hooks'

type Props = {
  size: number
}

export function EtherscanIcon({ size }: Props): JSX.Element {
  const isDarkMode = useIsDarkMode()

  return isDarkMode ? (
    <EtherscanLogoDark height={size} width={size} />
  ) : (
    <EtherscanLogoLight height={size} width={size} />
  )
}
