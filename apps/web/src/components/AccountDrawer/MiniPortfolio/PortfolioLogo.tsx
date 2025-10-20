import { Currency } from '@uniswap/sdk-core'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import React, { memo } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

interface PortfolioLogoProps {
  chainId: UniverseChainId
  accountAddress?: string
  currencies?: Array<Currency | undefined>
  images?: Array<string | undefined>
  size?: number
  style?: React.CSSProperties
  customIcon?: React.ReactNode
}

const LOGO_DEFAULT_SIZE = 40

export const PortfolioLogo = memo(function PortfolioLogo(props: PortfolioLogoProps) {
  const colors = useSporeColors()

  if (isTestnetChain(props.chainId)) {
    return <CurrencyLogo currency={props.currencies?.[0]} size={props.size} />
  }

  return (
    <Flex alignItems="center" top={0} left={0} style={props.style}>
      <Flex position="relative">{getLogo(props, colors)}</Flex>
    </Flex>
  )
})

function getLogo(
  { accountAddress, currencies, images, chainId, customIcon, size = LOGO_DEFAULT_SIZE }: PortfolioLogoProps,
  colors: UseSporeColorsReturn,
) {
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
        inputCurrencyInfo={null}
        outputCurrencyInfo={null}
        chainId={chainId}
        size={size}
      />
    )
  }
  if (images && images.length === 1) {
    return <TokenLogo url={images[0]} size={size} chainId={chainId} />
  }
  return <UnknownStatus width={size} height={size} color={colors.neutral2.val} />
}
