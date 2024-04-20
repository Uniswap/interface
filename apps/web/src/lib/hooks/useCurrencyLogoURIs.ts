import { ChainId } from '@jaguarswap/sdk-core'
import useHttpLocations from 'hooks/useHttpLocations'
import { useMemo } from 'react'
import { isAddress } from 'utilities/src/addresses'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import { NATIVE_CHAIN_ID } from '../../constants/tokens'

type Network = 'X Layer' | 'X Layer Testnet'

export function chainIdToNetworkName(networkId: ChainId): Network {
  switch (networkId) {
    case ChainId.X1:
      return 'X Layer'
    case ChainId.X1_TESTNET:
      return 'X Layer Testnet'
    default:
      return 'X Layer'
  }
}

export function getNativeLogoURI(chainId: ChainId = ChainId.X1): string {
  switch (chainId) {
    default:
      return EthereumLogo
  }
}

function getTokenLogoURI(address: string, chainId: ChainId = ChainId.X1): string | void {
  const networkName = chainIdToNetworkName(chainId)
  const networksWithUrls = [ChainId.X1, ChainId.X1_TESTNET]

  if (networksWithUrls.includes(chainId)) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
  }
}

export default function useCurrencyLogoURIs(
  currency:
    | {
        isNative?: boolean
        isToken?: boolean
        address?: string
        chainId: number
        logoURI?: string | null
      }
    | null
    | undefined
): string[] {
  const locations = useHttpLocations(currency?.logoURI)
  return useMemo(() => {
    const logoURIs = [...locations]
    if (currency) {
      if (currency.isNative || currency.address === NATIVE_CHAIN_ID) {
        logoURIs.push(getNativeLogoURI(currency.chainId))
      } else if (currency.isToken || currency.address) {
        const checksummedAddress = isAddress(currency.address)
        const logoURI = checksummedAddress && getTokenLogoURI(checksummedAddress, currency.chainId)
        if (logoURI) {
          logoURIs.push(logoURI)
        }
      }
    }
    return logoURIs
  }, [currency, locations])
}
