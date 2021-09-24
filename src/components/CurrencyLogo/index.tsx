import { ChainId, Currency, Token, DXD, SWPR } from '@swapr/sdk'
import React, { ReactNode, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import styled from 'styled-components'

import EtherLogo from '../../assets/images/ether-logo.png'
import XDAILogo from '../../assets/images/xdai-logo.png'
import DXDLogo from '../../assets/svg/dxd.svg'
import SWPRLogo from '../../assets/images/swpr-logo.png'
import { useActiveWeb3React } from '../../hooks'
import useHttpLocations from '../../hooks/useHttpLocations'
import { useTokenInfoFromActiveListOnCurrentChain } from '../../state/lists/hooks'
import { WrappedTokenInfo } from '../../state/lists/wrapped-token-info'
import Logo from '../Logo'

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledLogo = styled(Logo)<{ size: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
`

const Wrapper = styled.div<{ size: string; marginRight: number; marginLeft: number; loading?: boolean }>`
  position: relative;
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  margin-right: ${({ marginRight }) => marginRight}px;
  margin-left: ${({ marginLeft }) => marginLeft}px;
  border-radius: ${({ size }) => size};

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    ${({ size }) => `width: calc(${size} - 1px)`};
    ${({ size }) => `height: calc(${size} - 1px)`};
    background-color: ${props => (props.loading ? 'transparent' : props.theme.white)};
    border-radius: 50%;
    z-index: -1;
  }
`

const NATIVE_CURRENCY_LOGO: { [chainId in ChainId]: string } = {
  [ChainId.ARBITRUM_ONE]: EtherLogo,
  [ChainId.ARBITRUM_RINKEBY]: EtherLogo,
  [ChainId.MAINNET]: EtherLogo,
  [ChainId.RINKEBY]: EtherLogo,
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
  const wrappedTokenInfo = useTokenInfoFromActiveListOnCurrentChain(currency)
  const uriLocations = useHttpLocations(
    currency instanceof WrappedTokenInfo ? currency.logoURI : !!wrappedTokenInfo ? wrappedTokenInfo.logoURI : undefined
  )

  const srcs: string[] = useMemo(() => {
    if (currency && Currency.isNative(currency) && !!nativeCurrencyLogo) return [nativeCurrencyLogo]
    if (currency instanceof Token) {
      if (Token.isNativeWrapper(currency)) return [nativeCurrencyLogo]
      if (chainId && DXD[chainId] && DXD[chainId].address === currency.address) return [DXDLogo]
      if (chainId && SWPR[chainId] && SWPR[chainId].address === currency.address) return [SWPRLogo]
      return [getTokenLogoURL(currency.address), ...uriLocations]
    }
    return []
  }, [chainId, currency, nativeCurrencyLogo, uriLocations])

  if (loading)
    return (
      <Skeleton
        wrapper={({ children }: { children: ReactNode }) => (
          <Wrapper
            loading={loading}
            size={size}
            marginRight={marginRight}
            marginLeft={marginLeft}
            className={className}
          >
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
