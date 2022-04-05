import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import Logo from '../Logo'

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

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  ...rest
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return []

    if (currency.isToken) {
      const defaultUrls = currency.chainId === 1 ? [getTokenLogoURL(currency.address)] : []
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, ...defaultUrls]
      }
      return defaultUrls
    }
    return []
  }, [currency, uriLocations])

  if (currency?.isNative) {
    return <StyledEthereumLogo src={EthereumLogo} size={size} style={style} {...rest} />
  }


  if (currency?.address?.toLowerCase() === '0xff69e48af1174da7f15d0c771861c33d3f19ed8a'.toLowerCase()) 
  return <StyledLogo size={size} srcs={['https://assets.coingecko.com/coins/images/17468/small/400_filter_nobg_60c70a3c5aae1.jpg?1628214173']} alt={`${currency.symbol ?? 'token'} logo`} style={style} {...rest} />
  if (currency?.address?.toLowerCase() === '0x99d36e97676a68313ffdc627fd6b56382a2a08b6'.toLowerCase())
  return <StyledLogo size={size} srcs={['https://babytrumptoken.com/images/Baby_Trump_Transpa.png']} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />

  if (currency?.address?.toLowerCase() === '0x4d7beb770bb1c0ac31c2b3a3d0be447e2bf61013'.toLowerCase())
  return <StyledLogo size={size} srcs={['https://babytrumptoken.com/images/CoinGecko.png']} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
  if (currency?.address?.toLowerCase() === '0x29699C8485302cd2857043FaB8bd885bA08Cf268'.toLowerCase())
  return <StyledLogo size={size} srcs={['https://babytrumptoken.com/images/Trump_Gold_Coin_Gecko.png']} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}
