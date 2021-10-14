import { ChainId, Currency, ETHER } from 'libs/sdk/src'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import MaticLogo from '../../assets/networks/polygon-network.png'
import BnbLogo from '../../assets/images/bnb-logo.png'
import AvaxLogo from '../../assets/networks/avax-network.png'
import useHttpLocations from '../../hooks/useHttpLocations'
import { useActiveWeb3React } from 'hooks'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import Logo from '../Logo'
import { getTokenLogoURL } from 'utils'

const StyledNativeCurrencyLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: 50%;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  object-fit: contain;
`

const logo: { readonly [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: EthereumLogo,
  [ChainId.ROPSTEN]: EthereumLogo,
  [ChainId.RINKEBY]: EthereumLogo,
  [ChainId.GÖRLI]: EthereumLogo,
  [ChainId.KOVAN]: EthereumLogo,
  [ChainId.MATIC]: MaticLogo,
  [ChainId.MUMBAI]: MaticLogo,
  [ChainId.BSCTESTNET]: BnbLogo,
  [ChainId.BSCMAINNET]: BnbLogo,
  [ChainId.AVAXTESTNET]: AvaxLogo,
  [ChainId.AVAXMAINNET]: AvaxLogo
}

export default function CurrencyLogo({
  currency,
  size = '24px',
  style
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const { chainId } = useActiveWeb3React()
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (currency === ETHER) return []

    if (!!(currency as any)?.address) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address, chainId)]
      }

      return [getTokenLogoURL((currency as any)?.address, chainId)]
    }

    // if (currency instanceof Token) {
    //   if (currency instanceof WrappedTokenInfo) {
    //     return [...uriLocations, getTokenLogoURL(currency.address, chainId)]
    //   }

    //   return [getTokenLogoURL(currency.address, chainId)]
    // }
    return []
  }, [chainId, currency, uriLocations])

  if (currency === ETHER && chainId) {
    return <StyledNativeCurrencyLogo src={logo[chainId]} size={size} style={style} alt={`${currency.symbol}Logo`} />
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
