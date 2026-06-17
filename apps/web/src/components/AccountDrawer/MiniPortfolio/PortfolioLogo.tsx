import { Currency } from '@uniswap/sdk-core'
import React, { memo } from 'react'
import { Flex } from 'ui/src'
import { ContractInteraction } from 'ui/src/components/icons/ContractInteraction'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'

interface PortfolioLogoProps {
  chainId: UniverseChainId
  accountAddress?: string
  currencies?: Array<Currency | undefined>
  images?: Array<string | undefined>
  fallbackSymbols?: Array<string | undefined>
  size?: number
  style?: React.CSSProperties
  customIcon?: React.ReactNode
}

export const PORTFOLIO_LOGO_DEFAULT_SIZE = 40

export const PortfolioLogo = memo(function PortfolioLogo(props: PortfolioLogoProps) {
  // On testnets, currency-based activities resolve their logo through CurrencyLogo (useCurrencyInfo).
  // But activities that carry raw image URLs instead of a Currency — e.g. a just-launched token that
  // isn't indexed yet — have nothing for CurrencyLogo to resolve, so it would render blank. Let those
  // fall through to getLogo (TokenLogo already applies testnet styling) instead of swallowing them.
  if (isTestnetChain(props.chainId) && !props.images?.length) {
    return <CurrencyLogo currency={props.currencies?.[0]} size={props.size} />
  }

  return (
    <Flex alignItems="center" top={0} left={0} style={props.style}>
      <Flex position="relative">{getLogo(props)}</Flex>
    </Flex>
  )
})

function getLogo({
  accountAddress,
  currencies,
  images,
  fallbackSymbols,
  chainId,
  customIcon,
  size = PORTFOLIO_LOGO_DEFAULT_SIZE,
}: PortfolioLogoProps) {
  if (accountAddress) {
    return <AccountIcon address={accountAddress} size={size} />
  }
  if (currencies && currencies.length) {
    return <DoubleCurrencyLogo currencies={currencies} size={size} customIcon={customIcon} />
  }

  if (images && images.length >= 2) {
    return (
      <SplitLogo
        inputLogoUrl={images[0]}
        outputLogoUrl={images[1]}
        inputFallbackSymbol={fallbackSymbols?.[0]}
        outputFallbackSymbol={fallbackSymbols?.[1]}
        inputCurrencyInfo={null}
        outputCurrencyInfo={null}
        chainId={chainId}
        size={size}
      />
    )
  }
  if (images && images.length === 1) {
    return <TokenLogo url={images[0]} size={size} chainId={chainId} symbol={fallbackSymbols?.[0]} />
  }
  if (customIcon && !accountAddress && !currencies?.length && !images?.length) {
    return (
      <Flex alignItems="center" height={size} justifyContent="center" width={size}>
        {customIcon}
      </Flex>
    )
  }
  return <ContractInteraction size={size} color="$neutral2" />
}
