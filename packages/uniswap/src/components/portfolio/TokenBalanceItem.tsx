import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text, useIsDarkMode } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useRestTokenBalanceMainParts, useRestTokenBalanceQuantityParts } from 'uniswap/src/data/rest/getPortfolio'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useTokenBalanceListContext } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { CurrencyId } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'

/**
 * IMPORTANT: if you modify the UI of this component, make sure to update the corresponding Skeleton component.
 */

interface TokenBalanceItemProps {
  currencyInfo: CurrencyInfo
  isLoading?: boolean
  padded?: boolean
  isHidden: boolean
}

/**
 * If you add any props to this component, make sure you use the react-devtools profiler to confirm that this doesn't break the memoization.
 * This component needs to be as fast as possible and shouldn't re-render often or else it causes performance issues.
 */
export const TokenBalanceItem = memo(function _TokenBalanceItem({
  currencyInfo,
  isLoading,
  padded,
  isHidden,
}: TokenBalanceItemProps) {
  const { currency } = currencyInfo
  const { evmOwner, svmOwner } = useTokenBalanceListContext()

  // Ensure items rerender when theme is switched
  useIsDarkMode()

  const shortenedSymbol = getSymbolDisplayText(currency.symbol)

  return (
    <Flex
      alignItems="flex-start"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      justifyContent="space-between"
      hoverStyle={{ backgroundColor: '$surface2' }}
      px={padded ? '$spacing24' : '$spacing8'}
      py="$spacing8"
      testID={`TokenBalanceItem_${currency.symbol}`}
    >
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl ?? undefined}
        />
        <Flex shrink alignItems="flex-start">
          <Text ellipsizeMode="tail" numberOfLines={1} variant={isWebPlatform ? 'body2' : 'body1'}>
            {currency.name ?? shortenedSymbol}
          </Text>
          <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
            <TokenBalanceQuantity
              shortenedSymbol={shortenedSymbol}
              currencyId={currencyInfo.currencyId}
              evmAddress={evmOwner}
              svmAddress={svmOwner}
            />
          </Flex>
        </Flex>
      </Flex>

      {currencyInfo.isSpam === true && isHidden ? undefined : (
        <TokenBalanceRightSideColumn
          isLoading={isLoading}
          currencyId={currencyInfo.currencyId}
          evmAddress={evmOwner}
          svmAddress={svmOwner}
        />
      )}
    </Flex>
  )
})

function TokenBalanceQuantity({
  shortenedSymbol,
  currencyId,
  evmAddress,
  svmAddress,
}: {
  shortenedSymbol: Maybe<string>
  currencyId: CurrencyId
  evmAddress?: string
  svmAddress?: string
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()

  // By relying on this cached data we can avoid re-renders unless these specific fields change.
  const restTokenBalance = useRestTokenBalanceQuantityParts({
    currencyId,
    evmAddress,
    svmAddress,
  })

  const tokenBalance = restTokenBalance.data

  return (
    <Text color="$neutral2" numberOfLines={1} variant={isWebPlatform ? 'body3' : 'body2'}>
      {`${formatNumberOrString({ value: tokenBalance?.quantity })}`} {shortenedSymbol}
    </Text>
  )
}

function TokenBalanceRightSideColumn({
  isLoading,
  currencyId,
  evmAddress,
  svmAddress,
}: {
  isLoading?: boolean
  currencyId: CurrencyId
  evmAddress?: string
  svmAddress?: string
}): JSX.Element {
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // By relying on this cached data we can avoid re-renders unless these specific fields change.
  const restTokenBalance = useRestTokenBalanceMainParts({
    currencyId,
    evmAddress,
    svmAddress,
  })
  const tokenBalance = restTokenBalance.data

  const balanceUSD = tokenBalance?.denominatedValue?.value
  const relativeChange24 = tokenBalance?.tokenProjectMarket?.relativeChange24?.value

  const balance = convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenQuantity)

  const isTestnetModeWithNoBalance = isTestnetModeEnabled && !balanceUSD

  return isTestnetModeWithNoBalance ? (
    <></>
  ) : (
    <Flex justifyContent="space-between" position="relative">
      <Shine disabled={!isLoading}>
        {!balanceUSD ? (
          <Flex centered fill>
            <Text color="$neutral2">{t('common.text.notAvailable')}</Text>
          </Flex>
        ) : (
          <Flex alignItems="flex-end" pl="$spacing8">
            <Text color="$neutral1" numberOfLines={1} variant={isWebPlatform ? 'body2' : 'body1'}>
              {balance}
            </Text>
            <RelativeChange
              alignRight
              change={relativeChange24}
              negativeChangeColor="$statusCritical"
              positiveChangeColor="$statusSuccess"
              variant={isWebPlatform ? 'body3' : 'body2'}
            />
          </Flex>
        )}
      </Shine>
    </Flex>
  )
}
