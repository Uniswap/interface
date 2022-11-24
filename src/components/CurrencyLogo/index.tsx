import { Currency } from '@kyberswap/ks-sdk-core'
import React, { memo, useMemo } from 'react'
import styled from 'styled-components'

import Logo from 'components/Logo'
import { useActiveWeb3React } from 'hooks'
import useHttpLocations from 'hooks/useHttpLocations'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
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

function CurrencyLogo({
  currency,
  size = '24px',
  style,
}: {
  currency?: Currency | WrappedTokenInfo | null
  size?: string
  style?: React.CSSProperties
}) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const logoURI = currency instanceof WrappedTokenInfo ? currency?.logoURI : undefined
  const uriLocations = useHttpLocations(logoURI)

  const srcs: string[] = useMemo(() => {
    if (currency?.isNative) return []

    if (currency?.isToken) {
      if (logoURI) {
        return [...uriLocations, getTokenLogoURL(currency.address, chainId)]
      }
      return [getTokenLogoURL((currency as any)?.address, chainId)]
    }

    return []
  }, [chainId, currency, uriLocations, logoURI])

  if (currency?.isNative && chainId) {
    return (
      <StyledNativeCurrencyLogo
        src={networkInfo.nativeToken.logo}
        size={size}
        style={style}
        alt={`${currency.symbol}Logo`}
      />
    )
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
export default memo(CurrencyLogo)
