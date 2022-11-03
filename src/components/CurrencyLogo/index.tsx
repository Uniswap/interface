import { Currency } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/TopTokens100Query.graphql'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import useCurrencyLogoURIs, { getNativeLogoURI } from 'lib/hooks/useCurrencyLogoURIs'
import React, { useMemo } from 'react'
import styled from 'styled-components/macro'

import Logo, { SmartLogo } from '../Logo'

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);
  border-radius: 50%;
  -mox-box-shadow: 0 0 1px black;
  -webkit-box-shadow: 0 0 1px black;
  box-shadow: 0 0 1px black;
  border: 0px solid rgba(255, 255, 255, 0);
`

const StyledSmartLogo = styled(SmartLogo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);
  border-radius: 50%;
  -mox-box-shadow: 0 0 1px black;
  -webkit-box-shadow: 0 0 1px black;
  box-shadow: 0 0 1px black;
  border: 0px solid rgba(255, 255, 255, 0);
`

const StyledNativeLogo = styled(StyledLogo)`
  -mox-box-shadow: 0 0 1px white;
  -webkit-box-shadow: 0 0 1px white;
  box-shadow: 0 0 1px white;
`

export default function CurrencyLogo({
  currency,
  symbol,
  size = '24px',
  style,
  src,
  ...rest
}: {
  currency?: Currency | null
  symbol?: string | null
  size?: string
  style?: React.CSSProperties
  src?: string | null
}) {
  const logoURIs = useCurrencyLogoURIs(currency)
  const srcs = useMemo(() => (src ? [src, ...logoURIs] : logoURIs), [src, logoURIs])
  const props = {
    alt: `${currency?.symbol ?? 'token'} logo`,
    size,
    srcs,
    symbol: symbol ?? currency?.symbol,
    style,
    ...rest,
  }

  return currency?.isNative ? <StyledNativeLogo {...props} /> : <StyledLogo {...props} />
}

export function TokenLogo({
  token,
  size = '24px',
  style,
  ...rest
}: {
  token?: {
    address?: string
    chain?: Chain | null
    chainId?: number | null
    symbol?: string | null
  }
  size?: string
  style?: React.CSSProperties
}) {
  // const chainId = token.chainId ?? (token.chain ? CHAIN_NAME_TO_CHAIN_ID[token.chain] : SupportedChainId.MAINNET)
  // const isNative = token.address === NATIVE_CHAIN_ID
  // const nativeCurrency = isNative ? nativeOnChain(chainId) : undefined
  // const currency = useMemo(
  //   () => ({
  //     chainId,
  //     address: token.address,
  //     isNative: token.address === NATIVE_CHAIN_ID,
  //     logoURI: TokenLogoLookupTable.checkIcon(token.address) ?? token.project?.logoUrl,
  //   }),
  //   [chainId, token.address, token.project?.logoUrl]
  // )
  // const logoURIs = useCurrencyLogoURIs(nativeCurrency ?? currency)

  const props = {
    alt: `${token?.symbol ?? 'token'} logo`,
    size,
    symbol: token?.symbol,
    style,
    ...rest,
  }

  if (!token) {
    return <StyledLogo srcs={[]} {...props} />
  }

  return !token.address || token.address === NATIVE_CHAIN_ID ? (
    <StyledNativeLogo
      srcs={[getNativeLogoURI(token.chainId ?? (token.chain && CHAIN_NAME_TO_CHAIN_ID[token.chain]) ?? undefined)]}
      {...props}
    />
  ) : (
    <StyledSmartLogo token={token} {...props} />
  )
}
