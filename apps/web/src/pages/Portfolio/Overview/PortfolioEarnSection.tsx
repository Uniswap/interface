import { CurrencyAmount, type Currency } from '@uniswap/sdk-core'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { FormattedAmountWithMutedDecimals } from 'uniswap/src/components/text/FormattedAmountWithMutedDecimals'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'

const EARN_LOADING_ROWS = 3
const LIFETIME_EARNINGS_USD_STUB = 0
const LIFETIME_EARNINGS_DECIMAL_OPACITY = 0.5
const VAULT_ROW_MIN_HEIGHT = 44

export const PortfolioEarnSection = memo(function PortfolioEarnSection({ account }: { account?: string }) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { closeModal, openDepositModal, openModal, selectedVaultState } = useEarnVaultModalState()
  const { isLoadingPositions, isLoadingVaults, positionsByVaultId, totalDepositedUsd, vaultsSortedByPosition } =
    useEarnVaults({ account })

  const shouldShowLoadingRows = isLoadingVaults || isLoadingPositions

  if (!shouldShowLoadingRows && vaultsSortedByPosition.length === 0) {
    return null
  }

  const totalDeposited = convertFiatAmountFormatted(totalDepositedUsd, NumberType.PortfolioBalance)
  // TODO(CONS-2146): Replace this stub once lifetime Earn earnings are available from data-api.
  const lifetimeEarnings = convertFiatAmountFormatted(LIFETIME_EARNINGS_USD_STUB, NumberType.PortfolioBalance)

  return (
    <>
      <Flex gap="$spacing16" px="$spacing8" data-testid={TestID.PortfolioOverviewEarnSection}>
        <Flex gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="subheading1" color="$neutral1">
              {t('explore.earn.title')}
            </Text>
            <Text variant="subheading1" color="$neutral2">
              ·
            </Text>
            <FormattedAmountWithMutedDecimals
              amount={totalDeposited}
              variant="subheading1"
              color={totalDepositedUsd > 0 ? '$neutral1' : '$neutral3'}
              decimalColor="$neutral3"
              loading={isLoadingPositions}
              testID={TestID.PortfolioOverviewEarnTotalDeposited}
            />
          </Flex>
          <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              {t('portfolio.overview.earn.lifetimeEarnings')}
            </Text>
            <FormattedAmountWithMutedDecimals
              amount={lifetimeEarnings}
              variant="body3"
              // $statusSuccess matches the color real lifetime earnings will use, so the value doesn't flip color once data-api lands.
              color="$statusSuccess"
              decimalOpacity={LIFETIME_EARNINGS_DECIMAL_OPACITY}
              justifyContent="flex-end"
              loading={isLoadingPositions}
              testID={TestID.PortfolioOverviewEarnLifetimeEarnings}
            />
          </Flex>
        </Flex>

        <Flex gap="$spacing8">
          {shouldShowLoadingRows
            ? Array.from({ length: EARN_LOADING_ROWS }).map((_, index) => <PortfolioEarnVaultRowSkeleton key={index} />)
            : vaultsSortedByPosition.map((vault) => {
                const position = positionsByVaultId.get(vault.id)
                return (
                  <PortfolioEarnVaultRow
                    key={vault.id}
                    vault={vault}
                    position={position}
                    onPress={() => (hasEarnPosition(position) ? openModal(vault) : openDepositModal(vault))}
                  />
                )
              })}
        </Flex>
      </Flex>

      <EarnVaultModal
        vault={selectedVaultState?.vault ?? null}
        prefetchedPosition={selectedVaultState?.vault ? positionsByVaultId.get(selectedVaultState.vault.id) : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
      />
    </>
  )
})

function PortfolioEarnVaultRow({
  vault,
  position,
  onPress,
}: {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  onPress: () => void
}) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.currencyId)
  const currency = currencyInfo?.currency
  const hasPosition = hasEarnPosition(position)
  const depositedCurrencyAmount = useMemo(
    () => getDepositedCurrencyAmount({ currency, position }),
    [currency, position],
  )
  const tokenAmount =
    depositedCurrencyAmount && currency
      ? `${formatCurrencyAmount({ value: depositedCurrencyAmount, type: NumberType.TokenNonTx })} ${currency.symbol}`
      : undefined

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
      <TokenLogo
        url={currencyInfo?.logoUrl}
        size={iconSizes.icon32}
        chainId={currency?.chainId}
        symbol={currency?.symbol}
        name={currency?.name}
        hideNetworkLogo
      />
      <Flex flex={1} minWidth={0}>
        <Text variant="body3" color="$neutral1" numberOfLines={1}>
          {currency?.symbol ?? '-'}
        </Text>
        <Text variant="body4" color="$accent1" numberOfLines={1}>
          {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
        </Text>
      </Flex>
      {hasPosition && position ? (
        <Flex alignItems="flex-end">
          <Text variant="body3" color="$neutral1" textAlign="right" numberOfLines={1}>
            {convertFiatAmountFormatted(position.depositedUsd, NumberType.PortfolioBalance)}
          </Text>
          <Text variant="body4" color="$neutral2" textAlign="right" numberOfLines={1}>
            {tokenAmount ?? '-'}
          </Text>
        </Flex>
      ) : (
        <Button size="xsmall" emphasis="secondary" fill={false}>
          {t('explore.earn.vault.deposit')}
        </Button>
      )}
    </TouchableArea>
  )
}

function PortfolioEarnVaultRowSkeleton() {
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
