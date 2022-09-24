import * as ethers from 'ethers'

import React, { useMemo, useState } from 'react'

import { Currency } from '@uniswap/sdk-core'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import { ImageProps } from 'rebass'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import _ from 'lodash'
import styled from 'styled-components/macro'
import { toChecksum } from 'state/logs/utils'
import trending from '../../trending.json'
import useHttpLocations from '../../hooks/useHttpLocations'
import { useWeb3React } from '@web3-react/core'

const BAD_SRCS: { [tokenAddress: string]: true } = {}
interface LogoProps extends Pick<ImageProps, 'style' | 'alt' | 'className'> {
  srcs: string[]
  symbol?: string
  size?: string
}

export const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo) <{ size: string }>`
  color: ${props => props.theme.black};
  circle {
    stroke: #ccc;
  }
  line {
    stroke:#ccc;
  }
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
 
`

const MissingImageLogo = styled.div<{ size?: string }>`
  --size: ${({ size }) => size};
  border-radius: 100px;
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.backgroundInteractive};
  font-size: calc(var(--size) / 3);
  font-weight: 500;
  height: ${({ size }) => size ?? '24px'};
  line-height: ${({ size }) => size ?? '24px'};
  text-align: center;
  width: ${({ size }) => size ?? '24px'};
`


/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
export function Logo({ srcs, alt, style, size, symbol, ...rest }: LogoProps) {
  const [, refresh] = useState<number>(0)

  const src: string | undefined = srcs.find((src) => !BAD_SRCS[src])

  if (src) {
    return (
      <img
        {...rest}
        alt={alt}
        src={src}
        style={style}
        onError={() => {
          if (src) BAD_SRCS[src] = true
          refresh((i) => i + 1)
        }}
      />
    )
  }

  return (
    <MissingImageLogo size={size}>
      {/* use only first 3 characters of Symbol for design reasons */}
      {symbol?.toUpperCase().replace('$', '').replace(/\s+/g, '').slice(0, 3)}
    </MissingImageLogo>
  )
}

const CurrencyLogo = React.memo(({
  currency,
  size = '24px',
  style = { color: `#ccc` },
  ...rest
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) => {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)
  const { chainId } = useWeb3React()
  const srcs: string[] = useMemo(() => {
    if (!currency) return []
    if (currency.isNative) return []
    const currencyObject = (currency as any);
    if (currency.isToken || currencyObject?.id || currencyObject?.address) {
      let tokenAddress = (currency?.address?.toLowerCase());
      if (currencyObject?.id && !tokenAddress) {
        tokenAddress = currencyObject?.id?.toLowerCase()
      }
      if (currencyObject?.address && !tokenAddress) {
        tokenAddress = currencyObject?.address?.toLowerCase()
      }

      const tokenAddressChecksummed = toChecksum(tokenAddress)
      const defaultURLs = [getTokenLogoURL(tokenAddressChecksummed)];
      const defaultUrls = chainId === 56 ?
        [
          currency?.symbol?.toLowerCase()?.includes('safemoon') ?
            `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLbVfJ-h_05UBkdvKyegU_KhVSmXiE9fzWpZLreSXBTmGHL4O7JmXqY0yw9rTweJDjGl8&usqp=CAU` :
            `https://pancakeswap.finance/images/tokens/${tokenAddressChecksummed}.png`
        ] :
        defaultURLs;

      if (currency instanceof WrappedTokenInfo) {
        return [
          ...uriLocations,
          ...defaultUrls
        ];
      }
      return defaultUrls;
    }
    return [];
  }, [currency, chainId, uriLocations])

  if (currency?.isNative) {
    return <StyledEthereumLogo src={EthereumLogo} size={size} style={style} {...rest} />
  }

  if (trending.some((token) => token?.address?.toLowerCase() === currency?.address?.toLowerCase())) {
    const trender = trending.find((token) => token?.address?.toLowerCase() === currency?.address?.toLowerCase());
    if (trender) return <StyledLogo symbol={trender?.symbol} size={size} srcs={[trender?.image]} alt={`${trender.name} Logo`} style={style} {...rest} />
  }

  return <StyledLogo symbol={currency?.symbol} size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}, (oldProps, newProps) => {  
  return oldProps?.currency?.wrapped?.address === newProps?.currency?.wrapped?.address?.toLowerCase() &&
    oldProps.currency?.name?.toLowerCase() === newProps?.currency?.name?.toLowerCase() &&
    oldProps?.currency?.symbol?.toLowerCase() === newProps?.currency?.symbol?.toLowerCase()
});

CurrencyLogo.displayName = 'CurrencyLogo';

export default CurrencyLogo;