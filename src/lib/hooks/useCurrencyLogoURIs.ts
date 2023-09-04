import { ChainId } from '@kinetix/sdk-core'
import useHttpLocations from 'hooks/useHttpLocations'
import { useMemo } from 'react'
import { isAddress } from 'utils'

import KavaLogo from '../../assets/svg/kava-logo.png'
import { NATIVE_CHAIN_ID } from '../../constants/tokens'

type Network = 'kava'

export function chainIdToNetworkName(networkId: ChainId): Network {
  switch (networkId) {
    case ChainId.KAVA:
      return 'kava'
    default:
      return 'kava'
  }
}

export function getNativeLogoURI(chainId: ChainId = ChainId.KAVA): string {
  switch (chainId) {
    case ChainId.KAVA:
      return KavaLogo
    default:
      return KavaLogo
  }
}

function getTokenLogoURI(address: string, chainId: ChainId = ChainId.KAVA): string | void {
  const networkName = chainIdToNetworkName(chainId)
  const networksWithUrls = [ChainId.KAVA]

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
