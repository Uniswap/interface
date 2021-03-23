import { ChainId, Currency, Token } from 'dxswap-sdk'
import React, { ReactNode, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import styled from 'styled-components'

import EthereumLogo from '../../assets/images/ethereum-logo.png'
import PoaLogo from '../../assets/images/poa-logo.png'
import XDAILogo from '../../assets/images/xdai-logo.png'
import { useActiveWeb3React } from '../../hooks'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import Logo from '../Logo'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
`

const Wrapper = styled.div<{ size: string; marginRight: number; marginLeft: number }>`
  margin-right: ${({ marginRight }) => marginRight}px;
  margin-left: ${({ marginLeft }) => marginLeft}px;
  border-radius: ${({ size }) => size};
`

const NATIVE_CURRENCY_LOGO: { [chainId in ChainId]: string } = {
  [ChainId.ARBITRUM_TESTNET_V3]: EthereumLogo,
  [ChainId.MAINNET]: EthereumLogo,
  [ChainId.RINKEBY]: EthereumLogo,
  [ChainId.SOKOL]: PoaLogo,
  [ChainId.XDAI]: XDAILogo
}

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  className,
  loading,
  marginRight = 0,
  marginLeft = 0
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
  className?: string
  loading?: boolean
  marginRight?: number
  marginLeft?: number
}) {
  const { chainId } = useActiveWeb3React()
  const nativeCurrencyLogo = NATIVE_CURRENCY_LOGO[(chainId as ChainId) || ChainId.MAINNET]
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (currency && Currency.isNative(currency) && !!nativeCurrencyLogo) return [nativeCurrencyLogo]
    if (currency instanceof Token) {
      if (Token.isNativeWrapper(currency)) return [nativeCurrencyLogo]
      return [getTokenLogoURL(currency.address), ...uriLocations]
    }
    return []
  }, [currency, nativeCurrencyLogo, uriLocations])

  if (loading)
    return (
      <Skeleton
        wrapper={({ children }: { children: ReactNode }) => (
          <Wrapper size={size} marginRight={marginRight} marginLeft={marginLeft} className={className}>
            {children}
          </Wrapper>
        )}
        circle
        width={size}
        height={size}
      />
    )
  return (
    <Wrapper size={size} marginRight={marginRight} marginLeft={marginLeft} className={className}>
      <StyledLogo
        size={size}
        defaultText={currency?.symbol || '?'}
        srcs={srcs}
        alt={`${currency?.symbol ?? 'token'} logo`}
        style={style}
      />
    </Wrapper>
  )
}
