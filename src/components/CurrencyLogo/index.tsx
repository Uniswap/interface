import * as ethers from 'ethers'

import React, { useMemo } from 'react'

import { Currency } from '@uniswap/sdk-core'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import Logo from '../Logo'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import _ from 'lodash'
import styled from 'styled-components/macro'
import trending from '../../trending.json'
import useHttpLocations from '../../hooks/useHttpLocations'
import { useWeb3React } from '@web3-react/core'

export const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`

const StyledEthereumLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo)<{ size: string }>`
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

 const CurrencyLogo = React.memo(({
  currency,
  size = '24px',
  style = { color: `#ccc`},
  ...rest
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) => {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)
  const {chainId} = useWeb3React()
  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return []
    const currencyObject = (currency as any);
    if (currency.isToken || currencyObject?.id || currencyObject?.address) {
      let tokenAddress = (currency?.address?.toLowerCase());
      if (currencyObject?.id && !tokenAddress) {
        tokenAddress = currencyObject?.id?.toLowerCase()
      } 
      if (currencyObject?.address && !tokenAddress) {
        tokenAddress = currencyObject?.address?.toLowerCase()
      }

      const tokenAddressChecksummed = ethers.utils.getAddress(tokenAddress)

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
    if (trender) return <StyledLogo size={size} srcs={[trender?.image]} alt ={`${trender.name} Logo`} style={style} {...rest} />
  }
  return <StyledLogo   size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}, _.isEqual);

CurrencyLogo.displayName = 'CurrencyLogo';

export default CurrencyLogo;