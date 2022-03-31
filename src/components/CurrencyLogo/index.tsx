import React, { useMemo } from 'react'

import { Currency } from '@uniswap/sdk-core'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import Logo from '../Logo'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import _ from 'lodash'
import logo from '../../assets/images/download.png'
import styled from 'styled-components/macro'
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
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
`

 const CurrencyLogo = React.memo(({
  currency,
  size = '24px',
  style,
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
    if (currency.isToken || currencyObject?.id) {
      let tokenAddress = (currency?.address);
      if (currencyObject?.id && !tokenAddress) {
        tokenAddress = currencyObject?.id
      }
      const defaultURLs = [getTokenLogoURL(tokenAddress)];
      const defaultUrls = chainId === 56 ? 
        [ 
          currency?.symbol?.toLowerCase()?.includes('safemoon') ?
          `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLbVfJ-h_05UBkdvKyegU_KhVSmXiE9fzWpZLreSXBTmGHL4O7JmXqY0yw9rTweJDjGl8&usqp=CAU` : 
          `https://pancakeswap.finance/images/tokens/${tokenAddress}.png`
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
  

  if (currency?.symbol?.toLowerCase() === 'kiba'.toLowerCase() || currency?.name?.toLowerCase() === 'kiba inu')
  return <StyledLogo size={size} srcs={['https://kibainu.space/wp-content/uploads/2021/11/photo_2021-11-05-08.31.13-copy-150x150.jpeg']} alt={`Kiba Inu logo`} style={style} {...rest} />
  
  if (currency?.symbol?.toLowerCase() === 'ccv2'.toLowerCase() && currency?.name?.toLowerCase() === 'cryptocart v2') 
  return <StyledLogo size={size} srcs={['https://s2.coinmarketcap.com/static/img/coins/64x64/9564.png']} alt={`CrytpoCart logo`} style={style} {...rest} />

  if (currency?.symbol?.toLowerCase() === 'stilton' || currency?.name?.toLowerCase() === 'stilton musk')
  return <StyledLogo size={size} srcs={['https://assets.coingecko.com/coins/images/23572/large/2022-02-09_11.32.27-removebg-preview.png?1644475684']} alt={`Stilton logo`} style={style} {...rest} />

  if (currency?.symbol?.toLowerCase() === 'vulture' || currency?.name?.toLowerCase() === 'vulture')
  return <StyledLogo size={size} srcs={['https://pbs.twimg.com/profile_banners/1504955501230051328/1648078134/1500x500']} alt={`Vulture logo`} style={style} {...rest} />

  if (currency?.symbol?.toLowerCase() === 'ck' || currency?.name?.toLowerCase() === 'crypto king') 
  return <StyledLogo size={size} srcs={['https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSt7jQS8Jx_R171pHWK3ffTtXnXKod0bZFoUg&usqp=CAU']} alt={`Vulture logo`} style={style} {...rest} />

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}, _.isEqual);

CurrencyLogo.displayName = 'CurrencyLogo';

export default CurrencyLogo;