import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

export function Balance({
  currency,
  chainId = UniverseChainId.Mainnet,
  fetchedBalance,
  onClick,
  showChainLogoOnly = false,
  isAggregate = false,
}: {
  currency?: Currency
  chainId?: UniverseChainId
  fetchedBalance?: PortfolioBalance
  onClick?: () => void
  showChainLogoOnly?: boolean
  isAggregate?: boolean
}): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const currencies = useMemo(() => (currency ? [currency] : []), [currency])

  const formattedBalance = formatNumberOrString({
    value: fetchedBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = convertFiatAmountFormatted(fetchedBalance?.balanceUSD, NumberType.PortfolioBalance)
  const tokenSymbol = currency?.symbol
  const tokenName = currency?.name

  if (isAggregate) {
    return (
      <Flex row alignItems="center">
        <PortfolioLogo
          currencies={currencies}
          chainId={chainId}
          images={fetchedBalance?.currencyInfo.logoUrl ? [fetchedBalance.currencyInfo.logoUrl] : undefined}
          size={32}
        />
        <Flex shrink row width="100%" justifyContent="space-between" alignItems="center" ml="$spacing12">
          <Flex>
            <Text variant="body2" color="$neutral1">
              {tokenName}
            </Text>
          </Flex>
          <Flex alignItems="flex-end">
            <Text variant="body2" color="$neutral1">
              {formattedUsdValue}
            </Text>
            <Text variant="body3" color="$neutral2">
              {formattedBalance} {tokenSymbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    )
  }

  return (
    <TouchableArea onPress={onClick} {...(onClick ? ClickableTamaguiStyle : {})}>
      <Flex my="$spacing8" row alignItems="center">
        {showChainLogoOnly ? (
          <ChainLogo chainId={chainId} size={24} borderRadius={6} />
        ) : (
          <PortfolioLogo
            currencies={currencies}
            chainId={chainId}
            images={fetchedBalance?.currencyInfo.logoUrl ? [fetchedBalance.currencyInfo.logoUrl] : undefined}
            size={32}
          />
        )}
        <Flex shrink row width="100%" justifyContent="space-between" alignItems="center" ml="$spacing12">
          <Flex>
            <Text variant="subheading2" color="$neutral1">
              {formattedUsdValue}
            </Text>
          </Flex>
          <Flex>
            <Text variant="body3" color="$neutral2">
              {formattedBalance} {tokenSymbol}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
