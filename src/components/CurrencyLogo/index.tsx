import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'
import EthereumLogo from '../../assets/images/ethereum-logo.png'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/wrappedTokenInfo'
import Logo from '../Logo'
import logo from '../../assets/images/download.png'
import _ from 'lodash'
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
    console.log(currency)
    if (!currency || currency.isNative) return []

    if (currency.isToken || (currency as any)?.id) {
      let tokenAdd = currency?.address
      if((currency as any)?.id && !currency?.address) tokenAdd = (currency as any)?.id
      const defaultURL = [getTokenLogoURL(tokenAdd)] ;
      const defaultUrls = chainId === 56 ? [`https://pancakeswap.finance/images/tokens/${tokenAdd}.png`] : defaultURL
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, ...defaultUrls]
      }
      return defaultUrls
    }
    return []
  }, [currency, chainId, uriLocations])

  if (currency?.isNative) {
    return <StyledEthereumLogo src={EthereumLogo} size={size} style={style} {...rest} />
  }
  

  if (currency?.symbol?.toLowerCase() === 'kiba'.toLowerCase() || currency?.name?.toLowerCase() === 'kiba inu')
  return <StyledLogo size={size} srcs={['https://kibainu.space/wp-content/uploads/2021/11/photo_2021-11-05-08.31.13-copy-150x150.jpeg']} alt={`Kiba Inu logo`} style={style} {...rest} />
  
  
  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}, _.isEqual);

CurrencyLogo.displayName = 'CurrencyLogo';

export default CurrencyLogo;