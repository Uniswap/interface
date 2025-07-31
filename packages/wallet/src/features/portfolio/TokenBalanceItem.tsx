import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useRestTokenBalanceMainParts, useRestTokenBalanceQuantityParts } from 'uniswap/src/data/rest/getPortfolio'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CurrencyId } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { isWeb } from 'utilities/src/platform'
import { useTokenBalanceListContext } from 'wallet/src/features/portfolio/TokenBalanceListContext'
import {
  useTokenBalanceMainPartsFragment,
  useTokenBalanceQuantityPartsFragment,
} from 'wallet/src/features/portfolio/fragments'
import { disableOnPress } from 'wallet/src/utils/disableOnPress'

/**
 * IMPORTANT: if you modify the UI of this component, make sure to update the corresponding Skeleton component.
 */

interface TokenBalanceItemProps {
  portfolioBalanceId: string
  currencyInfo: CurrencyInfo
  onPressToken?: (currencyId: CurrencyId) => void
  isLoading?: boolean
  padded?: boolean
  isHidden: boolean
}

/**
 * If you add any props to this component, make sure you use the react-devtools profiler to confirm that this doesn't break the memoization.
 * This component needs to be as fast as possible and shouldn't re-render often or else it causes performance issues.
 */
export const TokenBalanceItem = memo(function _TokenBalanceItem({
  portfolioBalanceId,
  currencyInfo,
  onPressToken,
  isLoading,
  padded,
  isHidden,
}: TokenBalanceItemProps) {
  const { currency } = currencyInfo
  const address = useTokenBalanceListContext().owner

  // Ensure items rerender when theme is switched
  useIsDarkMode()

  // Only return a function if onPressToken is provided, otherwise onPress is always defined and this element will intercept all clicks.
  const onPress = useMemo(() => {
    if (!onPressToken) {
      return undefined
    }
    return (): void => {
      onPressToken(currencyInfo.currencyId)
    }
  }, [currencyInfo.currencyId, onPressToken])

  const shortenedSymbol = getSymbolDisplayText(currency.symbol)

  return (
    <TouchableArea
      hoverable
      alignItems="flex-start"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      justifyContent="space-between"
      px={padded ? '$spacing24' : '$spacing8'}
      py="$spacing8"
      onLongPress={disableOnPress}
      onPress={onPress}
    >
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl ?? undefined}
        />
        <Flex shrink alignItems="flex-start">
          <Text ellipsizeMode="tail" numberOfLines={1} variant={isWeb ? 'body2' : 'body1'}>
            {currency.name ?? shortenedSymbol}
          </Text>
          <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
            <TokenBalanceQuantity
              portfolioBalanceId={portfolioBalanceId}
              shortenedSymbol={shortenedSymbol}
              currencyId={currencyInfo.currencyId}
              address={address}
            />
          </Flex>
        </Flex>
      </Flex>

      {currencyInfo.isSpam === true && isHidden ? undefined : (
        <TokenBalanceRightSideColumn
          portfolioBalanceId={portfolioBalanceId}
          isLoading={isLoading}
          currencyId={currencyInfo.currencyId}
          address={address}
        />
      )}
    </TouchableArea>
  )
})

function TokenBalanceQuantity({
  portfolioBalanceId,
  shortenedSymbol,
  currencyId,
  address,
}: {
  portfolioBalanceId: string
  shortenedSymbol: Maybe<string>
  currencyId: CurrencyId
  address?: string
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestBalances)

  // By relying on this cached data we can avoid re-renders unless these specific fields change.
  const gqlTokenBalance = useTokenBalanceQuantityPartsFragment({ id: portfolioBalanceId })
  const restTokenBalance = useRestTokenBalanceQuantityParts({
    currencyId,
    address,
    enabled: isRestEnabled,
  })

  const tokenBalance = isRestEnabled ? restTokenBalance.data : gqlTokenBalance.data

  return (
    <Text color="$neutral2" numberOfLines={1} variant={isWeb ? 'body3' : 'body2'}>
      {`${formatNumberOrString({ value: tokenBalance?.quantity })}`} {shortenedSymbol}
    </Text>
  )
}

function TokenBalanceRightSideColumn({
  portfolioBalanceId,
  isLoading,
  currencyId,
  address,
}: {
  portfolioBalanceId: string
  isLoading?: boolean
  currencyId: CurrencyId
  address?: string
}): JSX.Element {
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isRestEnabled = useFeatureFlag(FeatureFlags.GqlToRestBalances)

  // By relying on this cached data we can avoid re-renders unless these specific fields change.
  const gqlTokenBalance = useTokenBalanceMainPartsFragment({ id: portfolioBalanceId })
  const restTokenBalance = useRestTokenBalanceMainParts({
    currencyId,
    address,
    enabled: isRestEnabled,
  })
  const tokenBalance = isRestEnabled ? restTokenBalance.data : gqlTokenBalance.data

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
            <Text color="$neutral1" numberOfLines={1} variant={isWeb ? 'body2' : 'body1'}>
              {balance}
            </Text>
            <RelativeChange
              alignRight
              change={relativeChange24}
              negativeChangeColor="$statusCritical"
              positiveChangeColor="$statusSuccess"
              variant={isWeb ? 'body3' : 'body2'}
            />
          </Flex>
        )}
      </Shine>
    </Flex>
  )
}
