import React from 'react'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import EtherscanLogoDark from 'ui/src/assets/logos/etherscan-logo-dark.svg'
import EtherscanLogoLight from 'ui/src/assets/logos/etherscan-logo-light.svg'

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
