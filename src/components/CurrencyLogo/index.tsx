import { Currency } from '@uniswap/sdk-core'
import EthereumLogo from 'assets/images/ethereum-logo.png'
import MaticLogo from 'assets/svg/matic-token-icon.svg'
import { SupportedChainId } from 'constants/chains'
import useHttpLocations from 'hooks/useHttpLocations'
import React, { useMemo } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import styled from 'styled-components/macro'

import Logo from '../Logo'

type Network = 'ethereum' | 'arbitrum' | 'optimism'

function chainIdToNetworkName(networkId: SupportedChainId): Network {
  switch (networkId) {
    case SupportedChainId.MAINNET:
      return 'ethereum'
    case SupportedChainId.ARBITRUM_ONE:
      return 'arbitrum'
    case SupportedChainId.OPTIMISM:
      return 'optimism'
    default:
      return 'ethereum'
  }
}

export const getTokenLogoURL = (
  address: string,
  chainId: SupportedChainId = SupportedChainId.MAINNET
): string | void => {
  const networkName = chainIdToNetworkName(chainId)
  const networksWithUrls = [SupportedChainId.ARBITRUM_ONE, SupportedChainId.MAINNET, SupportedChainId.OPTIMISM]
  if (networksWithUrls.includes(chainId)) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
  }
}

const StyledNativeLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);

  border-radius: 50%;
  -mox-box-shadow: 0 0 1px white;
  -webkit-box-shadow: 0 0 1px white;
  box-shadow: 0 0 1px white;
  border: 0px solid rgba(255, 255, 255, 0);
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);
  border-radius: 50%;
  -mox-box-shadow: 0 0 1px black;
  -webkit-box-shadow: 0 0 1px black;
  box-shadow: 0 0 1px black;
  border: 0px solid rgba(255, 255, 255, 0);
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  ...rest
}: {
  currency?: Currency | null
  size?: string
  style?: React.CSSProperties
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return []

    if (currency.isToken) {
      const defaultUrls = []
      const url = getTokenLogoURL(currency.address, currency.chainId)
      if (url) {
        defaultUrls.push(url)
      }
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, ...defaultUrls]
      }
      return defaultUrls
    }
    return []
  }, [currency, uriLocations])

  if (currency?.isNative) {
    let nativeLogoUrl: string
    switch (currency.chainId) {
      case SupportedChainId.POLYGON_MUMBAI:
      case SupportedChainId.POLYGON:
        nativeLogoUrl = MaticLogo
        break
      default:
        nativeLogoUrl = EthereumLogo
        break
    }
    return <StyledNativeLogo src={nativeLogoUrl} alt="ethereum logo" size={size} style={style} {...rest} />
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}
