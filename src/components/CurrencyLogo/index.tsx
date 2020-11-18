import { Currency, ETHER as FUSE, Token, ChainId } from '@fuseio/fuse-swap-sdk'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import FuseLogo from '../../assets/images/fuse-logo.png'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo, useSelectedSwapTokenList } from '../../state/lists/hooks'
import Logo from '../Logo'
import { useActiveWeb3React } from '../../hooks'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

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
  const list = useSelectedSwapTokenList()

  const srcs: string[] = useMemo(() => {
    if (currency === FUSE) return []

    if (!chainId) return []

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURL(currency.address)]
      }

      if (list[chainId][currency.address]) {
        const {
          tokenInfo: { logoURI }
        } = list[chainId][currency.address]

        return logoURI ? [logoURI] : []
      }
    }
    return []
  }, [chainId, currency, list, uriLocations])

  if (currency === FUSE) {
    if (chainId === ChainId.MAINNET || chainId === ChainId.ROPSTEN) {
      return <StyledEthereumLogo src={EthereumLogo} size={size} style={style} />
    } else {
      return <StyledEthereumLogo src={FuseLogo} size={size} style={style} />
    }
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
