import { CurrencyAmount, type Currency } from '@uniswap/sdk-core'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { FormattedAmountWithMutedDecimals } from 'uniswap/src/components/text/FormattedAmountWithMutedDecimals'
import { useTokenProjectsByCurrencyId } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import {
  getEarnDepositSourceOptions,
  getEarnDepositSourceOptionsBySupport,
} from 'uniswap/src/features/earn/depositSources'
import { useEarnLifetimeEarningsUsd } from 'uniswap/src/features/earn/hooks/useEarnLifetimeEarningsUsd'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'

const EARN_LOADING_ROWS = 3
const LIFETIME_EARNINGS_DECIMAL_OPACITY = 0.5
const VAULT_ROW_MIN_HEIGHT = 44

function hasVisibleVaultRows({ isLoading, vaultCount }: { isLoading: boolean; vaultCount: number }): boolean {
  return !isLoading && vaultCount > 0
}

export const PortfolioEarnSection = memo(function PortfolioEarnSection({ account }: { account?: string }) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { closeModal, openDepositModal, openModal, selectedVaultState } = useEarnVaultModalState()
  const {
    isError,
    isLoadingPositions,
    isLoadingVaults,
    positionsByVaultId,
    refetch,
    totalDepositedUsd,
    vaultsSortedByPosition,
  } = useEarnVaults({ account })

  // ListEarnPositions doesn't carry lifetime_pnl_usd; fan out GetEarnPosition per active position.
  const vaultsWithActivePosition = useMemo(
    () => vaultsSortedByPosition.filter((vault) => hasEarnPosition(positionsByVaultId.get(vault.id))),
    [vaultsSortedByPosition, positionsByVaultId],
  )
  const {
    lifetimeEarningsUsd,
    isLoading: isLoadingLifetimeEarnings,
    isError: lifetimeEarningsError,
  } = useEarnLifetimeEarningsUsd({
    walletAddress: account,
    vaults: vaultsWithActivePosition,
  })
  const portfolioBalances = usePortfolioBalances({
    evmAddress: account,
    skip: !account,
  })
  const hasCachedPortfolioBalanceData =
    portfolioBalances.data !== undefined && portfolioBalances.dataUpdatedAt !== undefined
  const hasFreshPortfolioBalanceData = portfolioBalances.data !== undefined && !portfolioBalances.loading
  const hasUsablePortfolioBalanceData = hasCachedPortfolioBalanceData || hasFreshPortfolioBalanceData
  const hasSettledPortfolioBalances =
    hasUsablePortfolioBalanceData || (!portfolioBalances.loading && !portfolioBalances.error)
  const portfolioBalanceData = hasUsablePortfolioBalanceData ? portfolioBalances.data : undefined
  const tokenProjectCurrencyIds = useMemo(
    () => vaultsSortedByPosition.map((vault) => vault.currencyId),
    [vaultsSortedByPosition],
  )
  const { data: tokenProjectsByCurrencyId, loading: isLoadingTokenProjects } = useTokenProjectsByCurrencyId(
    account ? tokenProjectCurrencyIds : [],
  )
  const hasTokenBalanceByVaultId = useMemo(() => {
    const vaultBalanceMap = new Map<string, boolean>()

    vaultsSortedByPosition.forEach((vault) => {
      const tokenProjectDepositCurrencyIds = getCurrencyIds(tokenProjectsByCurrencyId?.get(vault.currencyId))
      const depositSourceOptions = getEarnDepositSourceOptions({
        portfolioBalances: portfolioBalanceData,
        tokenProjectCurrencyIds: tokenProjectDepositCurrencyIds,
        vault,
      })
      const { supportedDepositSourceOptions } = getEarnDepositSourceOptionsBySupport({ depositSourceOptions })
      vaultBalanceMap.set(vault.id, supportedDepositSourceOptions.length > 0)
    })

    return vaultBalanceMap
  }, [portfolioBalanceData, tokenProjectsByCurrencyId, vaultsSortedByPosition])
  const { eligibleVaults, ineligibleVaults } = useMemo(() => {
    const eligible: EarnVaultInfo[] = []
    const ineligible: EarnVaultInfo[] = []

    vaultsSortedByPosition.forEach((vault) => {
      const position = positionsByVaultId.get(vault.id)
      const hasTokenBalance = hasTokenBalanceByVaultId.get(vault.id) ?? false
      const destination = hasEarnPosition(position) || hasTokenBalance ? eligible : ineligible
      destination.push(vault)
    })

    return { eligibleVaults: eligible, ineligibleVaults: ineligible }
  }, [hasTokenBalanceByVaultId, positionsByVaultId, vaultsSortedByPosition])
  const hasDisplayableEarnPosition = useMemo(
    () => Array.from(positionsByVaultId.values()).some((position) => hasEarnPosition(position)),
    [positionsByVaultId],
  )

  const shouldShowLoadingRows =
    isLoadingVaults ||
    (isLoadingPositions && !hasDisplayableEarnPosition) ||
    !hasSettledPortfolioBalances ||
    (isLoadingTokenProjects && tokenProjectsByCurrencyId === undefined)
  const shouldShowPendingPositionRows = isLoadingPositions && hasDisplayableEarnPosition
  const shouldShowVaultDivider = !shouldShowLoadingRows && eligibleVaults.length > 0 && ineligibleVaults.length > 0
  const hasNoVaultRows = !shouldShowLoadingRows && vaultsSortedByPosition.length === 0
  const shouldShowErrorState = isError && hasNoVaultRows
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.PortfolioEarnSection,
    isVisible: hasVisibleVaultRows({ isLoading: shouldShowLoadingRows, vaultCount: vaultsSortedByPosition.length }),
    surface: EarnAnalyticsSurface.Web,
  })
  const handleVaultPress = useCallback(
    (vault: EarnVaultInfo, position: EarnPositionInfo | undefined): void => {
      if (hasEarnPosition(position)) {
        openModal(vault)
      } else {
        openModal(vault, { analyticsEntryPoint: EarnEntryPoint.PortfolioEarnSection })
      }
    },
    [openModal],
  )
  const handleGetTokenPress = useCallback(
    (vault: EarnVaultInfo): void => {
      openDepositModal(vault, { analyticsEntryPoint: EarnEntryPoint.PortfolioEarnGetToken })
    },
    [openDepositModal],
  )

  // Surface the error state only when the load failed with nothing to show; keep any stale data visible.
  if (shouldShowErrorState) {
    return <PortfolioEarnErrorState onRetry={refetch} />
  }

  if (hasNoVaultRows) {
    return null
  }

  const totalDeposited = convertFiatAmountFormatted(totalDepositedUsd, NumberType.PortfolioBalance)
  const lifetimeEarnings = convertFiatAmountFormatted(lifetimeEarningsUsd, NumberType.PortfolioBalance)

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
            {lifetimeEarningsError ? (
              <RewardsUnavailableIndicator />
            ) : (
              <FormattedAmountWithMutedDecimals
                amount={lifetimeEarnings}
                variant="body3"
                color="$statusSuccess"
                decimalOpacity={LIFETIME_EARNINGS_DECIMAL_OPACITY}
                justifyContent="flex-end"
                loading={isLoadingPositions || isLoadingLifetimeEarnings}
                testID={TestID.PortfolioOverviewEarnLifetimeEarnings}
              />
            )}
          </Flex>
        </Flex>

        <PortfolioEarnVaultRows
          shouldShowLoadingRows={shouldShowLoadingRows}
          shouldShowPendingPositionRows={shouldShowPendingPositionRows}
          shouldShowVaultDivider={shouldShowVaultDivider}
          eligibleVaults={eligibleVaults}
          ineligibleVaults={ineligibleVaults}
          positionsByVaultId={positionsByVaultId}
          hasTokenBalanceByVaultId={hasTokenBalanceByVaultId}
          onVaultPress={handleVaultPress}
          onGetTokenPress={handleGetTokenPress}
        />
      </Flex>

      <EarnVaultModal
        analyticsEntryPoint={selectedVaultState?.analyticsEntryPoint ?? EarnEntryPoint.PortfolioEarnSection}
        vault={selectedVaultState?.vault ?? null}
        prefetchedPosition={selectedVaultState?.vault ? positionsByVaultId.get(selectedVaultState.vault.id) : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
      />
    </>
  )
})

function PortfolioEarnVaultRows({
  shouldShowLoadingRows,
  shouldShowPendingPositionRows,
  shouldShowVaultDivider,
  eligibleVaults,
  ineligibleVaults,
  positionsByVaultId,
  hasTokenBalanceByVaultId,
  onVaultPress,
  onGetTokenPress,
}: {
  shouldShowLoadingRows: boolean
  shouldShowPendingPositionRows: boolean
  shouldShowVaultDivider: boolean
  eligibleVaults: EarnVaultInfo[]
  ineligibleVaults: EarnVaultInfo[]
  positionsByVaultId: ReadonlyMap<string, EarnPositionInfo>
  hasTokenBalanceByVaultId: ReadonlyMap<string, boolean>
  onVaultPress: (vault: EarnVaultInfo, position: EarnPositionInfo | undefined) => void
  onGetTokenPress: (vault: EarnVaultInfo) => void
}): JSX.Element {
  if (shouldShowLoadingRows) {
    return (
      <Flex gap="$spacing8">
        {Array.from({ length: EARN_LOADING_ROWS }).map((_, index) => (
          <PortfolioEarnVaultRowSkeleton key={index} />
        ))}
      </Flex>
    )
  }

  if (shouldShowPendingPositionRows) {
    const positionedVaults = eligibleVaults.filter((vault) => hasEarnPosition(positionsByVaultId.get(vault.id)))
    const loadingRows = Math.max(EARN_LOADING_ROWS - positionedVaults.length, 0)

    return (
      <Flex gap="$spacing8">
        {positionedVaults.map((vault) => {
          const position = positionsByVaultId.get(vault.id)
          return (
            <PortfolioEarnVaultRow
              key={vault.id}
              vault={vault}
              position={position}
              hasTokenBalance={hasTokenBalanceByVaultId.get(vault.id) ?? false}
              onPress={() => onVaultPress(vault, position)}
            />
          )
        })}
        {Array.from({ length: loadingRows }).map((_, index) => (
          <PortfolioEarnVaultRowSkeleton key={`pending-${index}`} />
        ))}
      </Flex>
    )
  }

  return (
    <Flex gap="$spacing8">
      {eligibleVaults.map((vault) => {
        const position = positionsByVaultId.get(vault.id)
        return (
          <PortfolioEarnVaultRow
            key={vault.id}
            vault={vault}
            position={position}
            hasTokenBalance={hasTokenBalanceByVaultId.get(vault.id) ?? false}
            onPress={() => onVaultPress(vault, position)}
          />
        )
      })}
      {shouldShowVaultDivider ? <Separator mx="$spacing8" /> : null}
      {ineligibleVaults.map((vault) => (
        <PortfolioEarnVaultGetTokenRow key={vault.id} vault={vault} onPress={() => onGetTokenPress(vault)} />
      ))}
    </Flex>
  )
}

function PortfolioEarnErrorState({ onRetry }: { onRetry: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing4" px="$spacing8" data-testid={TestID.PortfolioOverviewEarnError}>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="subheading1" color="$neutral1">
          {t('explore.earn.title')}
        </Text>
        <AlertTriangleFilled color="$neutral2" size="$icon.16" />
      </Flex>
      <Text variant="body3" color="$neutral2">
        {t('portfolio.overview.earn.errorLoadingBalance')}
      </Text>
      <TouchableArea variant="unstyled" onPress={onRetry} testID={TestID.PortfolioOverviewEarnRetry}>
        <TouchableArea.Text variant="body3" color="$neutral1">
          {t('common.button.tryAgain')}
        </TouchableArea.Text>
      </TouchableArea>
    </Flex>
  )
}

function getCurrencyIds(currencyInfos: ReadonlyArray<{ currencyId: string }> | undefined): string[] {
  return currencyInfos?.map((currencyInfo) => currencyInfo.currencyId) ?? []
}

function PortfolioEarnVaultRow({
  vault,
  position,
  hasTokenBalance,
  onPress,
}: {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  hasTokenBalance: boolean
  onPress: () => void
}) {
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
      ) : hasTokenBalance ? (
        <Button size="xsmall" emphasis="secondary" fill={false}>
          {t('explore.earn.vault.deposit')}
        </Button>
      ) : null}
    </TouchableArea>
  )
}

function PortfolioEarnVaultGetTokenRow({ vault, onPress }: { vault: EarnVaultInfo; onPress: () => void }) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? '-'

  return (
    <TouchableArea
      row
      alignItems="center"
      justifyContent="space-between"
      gap="$spacing8"
      width="100%"
      px="$spacing8"
      py="$spacing6"
      borderRadius="$rounded12"
      cursor="pointer"
      onPress={onPress}
      testID={`${TestID.PortfolioOverviewEarnGetTokenRowPrefix}${vault.id}`}
    >
      <Flex row alignItems="center" gap="$spacing8" minWidth={0} shrink>
        <TokenLogo
          url={currencyInfo?.logoUrl}
          size={iconSizes.icon20}
          chainId={currency?.chainId}
          symbol={currency?.symbol}
          name={currency?.name}
          hideNetworkLogo
        />
        <Text variant="body4" color="$neutral1" numberOfLines={1}>
          {currency?.name ?? symbol}
        </Text>
        <Text variant="body4" color="$accent1" numberOfLines={1}>
          {t('explore.earn.apy', { apy: formatPercent(vault.apyPercent) })}
        </Text>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8" flexShrink={0}>
        <Text variant="body4" color="$neutral2" textAlign="right" numberOfLines={1}>
          {t('tdp.button.getToken', { tokenSymbol: symbol })}
        </Text>
        <RotatableChevron direction="right" color="$neutral2" size="$icon.16" />
      </Flex>
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
