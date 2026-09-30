import { CurrencyAmount, type Currency } from '@uniswap/sdk-core'
import { Button, Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { NumberType } from 'utilities/src/format/types'

const VAULT_ROW_MIN_HEIGHT = 44

export function PortfolioEarnVaultRow({
  vault,
  position,
  hasTokenBalance,
  onPress,
}: {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  hasTokenBalance: boolean
  onPress?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const currency = currencyInfo?.currency
  const hasPosition = hasEarnPosition(position)
  const depositedCurrencyAmount = useMemo(
    () => getDepositedCurrencyAmount({ currency, position }),
    [currency, position],
  )
  const tokenAmount =
    depositedCurrencyAmount && currency
      ? `${formatCurrencyAmount({
          value: depositedCurrencyAmount,
          type: NumberType.TokenNonTx,
        })} ${currency.symbol}`
      : undefined

  // Keyed array (not a fragment) so TouchableArea's color injection reaches the direct children.
  const rowContent = [
    <TokenLogo
      key="logo"
      url={currencyInfo?.logoUrl}
      size={iconSizes.icon32}
      chainId={currency?.chainId}
      symbol={currency?.symbol}
      name={currency?.name}
      hideNetworkLogo
    />,
    <Flex key="token" flex={1} minWidth={0}>
      <Text variant="body3" color="$neutral1" numberOfLines={1}>
        {currency?.symbol ?? '-'}
      </Text>
      <Text variant="body4" color="$accent1" numberOfLines={1}>
        {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
      </Text>
    </Flex>,
    hasPosition && position ? (
      <Flex key="balance" alignItems="flex-end">
        <Text variant="body3" color="$neutral1" textAlign="right" numberOfLines={1}>
          {convertFiatAmountFormatted(position.depositedUsd, NumberType.PortfolioBalance)}
        </Text>
        <Text variant="body4" color="$neutral2" textAlign="right" numberOfLines={1}>
          {tokenAmount ?? '-'}
        </Text>
      </Flex>
    ) : hasTokenBalance ? (
      <Button key="deposit" size="xsmall" emphasis="secondary" fill={false}>
        {t('explore.earn.vault.deposit')}
      </Button>
    ) : null,
  ]

  if (!onPress) {
    return (
      <Flex
        row
        alignItems="center"
        gap="$spacing12"
        width="100%"
        minHeight={VAULT_ROW_MIN_HEIGHT}
        py="$spacing4"
        testID={`${TestID.PortfolioOverviewEarnVaultRowPrefix}${vault.id}`}
      >
        {rowContent}
      </Flex>
    )
  }

  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$spacing12"
      width="100%"
      minHeight={VAULT_ROW_MIN_HEIGHT}
      py="$spacing4"
      borderRadius="$rounded12"
      cursor="pointer"
      onPress={onPress}
      testID={`${TestID.PortfolioOverviewEarnVaultRowPrefix}${vault.id}`}
    >
      {rowContent}
    </TouchableArea>
  )
}

export function PortfolioEarnVaultRowSkeleton(): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing12"
      minHeight={VAULT_ROW_MIN_HEIGHT}
      px="$spacing12"
      py="$spacing4"
      testID={TestID.PortfolioOverviewEarnVaultRowSkeleton}
    >
      <Flex
        width={iconSizes.icon32}
        height={iconSizes.icon32}
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
      />
      <Flex flex={1} gap="$spacing4">
        <Text variant="body2" loading>
          -
        </Text>
        <Text variant="body4" loading>
          -
        </Text>
      </Flex>
      <Text variant="body2" loading>
        -
      </Text>
    </Flex>
  )
}

function getDepositedCurrencyAmount({
  currency,
  position,
}: {
  currency: Currency | undefined
  position: EarnPositionInfo | undefined
}): CurrencyAmount<Currency> | undefined {
  if (!currency || !position?.depositedRaw) {
    return undefined
  }

  try {
    return CurrencyAmount.fromRawAmount(currency, position.depositedRaw)
  } catch {
    return undefined
  }
}
