import { Flex, iconSizes, Separator, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { TestID } from '@universe/test'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { FormattedAmountWithMutedDecimals } from 'uniswap/src/components/text/FormattedAmountWithMutedDecimals'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { getProjectedAnnualEarnings } from 'uniswap/src/features/earn/amount'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import {
  getEarnDepositSourceOptions,
  getEarnDepositSourceOptionsBySupport,
} from 'uniswap/src/features/earn/depositSources'
import { useEarnLifetimeEarningsUsd } from 'uniswap/src/features/earn/hooks/useEarnLifetimeEarningsUsd'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import { LiveEarnRewardsAmount } from 'uniswap/src/features/earn/LiveEarnRewardsAmount'
import { RewardsUnavailableIndicator } from 'uniswap/src/features/earn/RewardsUnavailableIndicator'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getDisplayLifetimeEarningsUsd, hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useMultichainCurrencyInfosByCurrencyId } from 'uniswap/src/features/tokens/useMultichainCurrencyInfos'
import { NumberType } from 'utilities/src/format/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import { PortfolioEarnVaultRow, PortfolioEarnVaultRowSkeleton } from '~/pages/Portfolio/Overview/PortfolioEarnVaultRow'

const EARN_LOADING_ROWS = 3
const LIFETIME_EARNINGS_DECIMAL_OPACITY = 0.5

function hasVisibleVaultRows({ isLoading, vaultCount }: { isLoading: boolean; vaultCount: number }): boolean {
  return !isLoading && vaultCount > 0
}

export const PortfolioEarnSection = memo(function PortfolioEarnSection({
  account,
  isReadOnly = false,
}: {
  account?: string
  isReadOnly?: boolean
}) {
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
  const { portfolioBalanceData, hasSettledPortfolioBalances } = useEligibilityPortfolioBalances({
    account,
    isReadOnly,
  })
  const tokenProjectCurrencyIds = useMemo(
    () => (isReadOnly ? [] : vaultsSortedByPosition.map((vault) => vault.currencyId)),
    [isReadOnly, vaultsSortedByPosition],
  )
  const { data: tokenProjectsByCurrencyId, isLoading: isLoadingTokenProjects } = useMultichainCurrencyInfosByCurrencyId(
    account ? tokenProjectCurrencyIds : [],
  )
  const hasTokenBalanceByVaultId = useMemo(() => {
    const vaultBalanceMap = new Map<string, boolean>()

    if (isReadOnly) {
      return vaultBalanceMap
    }

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
  }, [isReadOnly, portfolioBalanceData, tokenProjectsByCurrencyId, vaultsSortedByPosition])
  const { eligibleVaults, ineligibleVaults } = useMemo(() => {
    // Read-only portfolios only list funded vaults — no deposit CTAs for someone else's wallet.
    if (isReadOnly) {
      return { eligibleVaults: vaultsWithActivePosition, ineligibleVaults: [] }
    }

    const eligible: EarnVaultInfo[] = []
    const ineligible: EarnVaultInfo[] = []

    vaultsSortedByPosition.forEach((vault) => {
      const position = positionsByVaultId.get(vault.id)
      const hasTokenBalance = hasTokenBalanceByVaultId.get(vault.id) ?? false
      const destination = hasEarnPosition(position) || hasTokenBalance ? eligible : ineligible
      destination.push(vault)
    })

    return { eligibleVaults: eligible, ineligibleVaults: ineligible }
  }, [hasTokenBalanceByVaultId, isReadOnly, positionsByVaultId, vaultsSortedByPosition, vaultsWithActivePosition])
  const hasDisplayableEarnPosition = vaultsWithActivePosition.length > 0

  // Eligibility inputs only gate unfunded rows — funded rows render once vaults + positions resolve.
  const isEligibilityLookupPending = !isReadOnly && (!hasSettledPortfolioBalances || isLoadingTokenProjects)
  const isVaultRowDataPending = isLoadingPositions || isEligibilityLookupPending
  const shouldShowLoadingRows = isLoadingVaults || (isVaultRowDataPending && !hasDisplayableEarnPosition)
  const shouldShowPendingPositionRows = isVaultRowDataPending && hasDisplayableEarnPosition
  const shouldShowVaultDivider = !shouldShowLoadingRows && eligibleVaults.length > 0 && ineligibleVaults.length > 0
  const hasNoVaultRows = !shouldShowLoadingRows && vaultsSortedByPosition.length === 0
  const shouldShowErrorState = isError && hasNoVaultRows
  // Read-only portfolios stay hidden unless the viewed wallet has a funded catalog vault.
  const isHiddenReadOnlySection = isReadOnly && eligibleVaults.length === 0
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.PortfolioEarnSection,
    isReadOnly,
    isVisible:
      !isHiddenReadOnlySection &&
      hasVisibleVaultRows({ isLoading: shouldShowLoadingRows, vaultCount: vaultsSortedByPosition.length }),
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

  if (isHiddenReadOnlySection) {
    return null
  }

  // Surface the error state only when the load failed with nothing to show; keep any stale data visible.
  if (shouldShowErrorState) {
    return <PortfolioEarnErrorState onRetry={refetch} />
  }

  if (hasNoVaultRows) {
    return null
  }

  const totalDeposited = convertFiatAmountFormatted(totalDepositedUsd, NumberType.PortfolioBalance)

  return (
    <>
      <Flex gap="$spacing16" px="$spacing8" testID={TestID.PortfolioOverviewEarnSection}>
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
              <PortfolioEarnLifetimeEarnings
                // Remount on wallet switch so the prior account's extrapolation never carries over.
                key={account}
                lifetimeEarningsUsd={lifetimeEarningsUsd}
                isLoading={isLoadingPositions || isLoadingLifetimeEarnings}
                vaultsWithActivePosition={vaultsWithActivePosition}
                positionsByVaultId={positionsByVaultId}
              />
            )}
          </Flex>
        </Flex>

        <PortfolioEarnVaultRows
          isReadOnly={isReadOnly}
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

      {!isReadOnly && (
        <EarnVaultModal
          analyticsEntryPoint={selectedVaultState?.analyticsEntryPoint ?? EarnEntryPoint.PortfolioEarnSection}
          vault={selectedVaultState?.vault ?? null}
          prefetchedPosition={
            selectedVaultState?.vault ? positionsByVaultId.get(selectedVaultState.vault.id) : undefined
          }
          initialView={selectedVaultState?.initialView}
          isOpen={selectedVaultState !== null}
          onClose={closeModal}
        />
      )}
    </>
  )
})

function PortfolioEarnLifetimeEarnings({
  lifetimeEarningsUsd,
  isLoading,
  vaultsWithActivePosition,
  positionsByVaultId,
}: {
  lifetimeEarningsUsd: number
  isLoading: boolean
  vaultsWithActivePosition: EarnVaultInfo[]
  positionsByVaultId: ReadonlyMap<string, EarnPositionInfo>
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const annualRewardsRateUsd = useMemo(
    () =>
      vaultsWithActivePosition.reduce((sum, vault) => {
        const position = positionsByVaultId.get(vault.id)
        return position
          ? sum + getProjectedAnnualEarnings({ balance: position.depositedUsd, apyPercent: position.apyPercent })
          : sum
      }, 0),
    [vaultsWithActivePosition, positionsByVaultId],
  )
  return (
    <LiveEarnRewardsAmount
      lifetimeEarningsUsd={isLoading ? undefined : lifetimeEarningsUsd}
      annualRewardsRateUsd={annualRewardsRateUsd}
      textVariant="$body3"
      containerTestID={TestID.PortfolioOverviewEarnLifetimeEarnings}
      // Idle wallets (nothing accruing) keep the plain two-decimal display.
      fallback={
        <FormattedAmountWithMutedDecimals
          amount={convertFiatAmountFormatted(
            getDisplayLifetimeEarningsUsd(lifetimeEarningsUsd),
            NumberType.PortfolioBalance,
          )}
          variant="body3"
          color="$statusSuccess"
          decimalOpacity={LIFETIME_EARNINGS_DECIMAL_OPACITY}
          justifyContent="flex-end"
          loading={isLoading}
          testID={TestID.PortfolioOverviewEarnLifetimeEarnings}
        />
      }
    />
  )
}

function PortfolioEarnVaultRows({
  isReadOnly,
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
  isReadOnly: boolean
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
              onPress={isReadOnly ? undefined : () => onVaultPress(vault, position)}
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
            onPress={isReadOnly ? undefined : () => onVaultPress(vault, position)}
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
    <Flex gap="$spacing4" px="$spacing8" testID={TestID.PortfolioOverviewEarnError}>
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
        {/* hoverStyle replaces the legacy TouchableArea hover-color injection, which skips mycelium children */}
        <Text variant="body3" color="$neutral1" hoverStyle={{ color: '$neutral1Hovered' }}>
          {t('common.button.tryAgain')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}

function useEligibilityPortfolioBalances({ account, isReadOnly }: { account?: string; isReadOnly: boolean }): {
  portfolioBalanceData: Record<string, PortfolioBalance> | undefined
  hasSettledPortfolioBalances: boolean
} {
  const portfolioBalances = usePortfolioBalances({
    evmAddress: account,
    skip: !account || isReadOnly,
  })
  const hasCachedPortfolioBalanceData =
    portfolioBalances.data !== undefined && portfolioBalances.dataUpdatedAt !== undefined
  const hasFreshPortfolioBalanceData = portfolioBalances.data !== undefined && !portfolioBalances.loading
  const hasUsablePortfolioBalanceData = hasCachedPortfolioBalanceData || hasFreshPortfolioBalanceData
  const hasSettledPortfolioBalances = hasUsablePortfolioBalanceData || !portfolioBalances.loading
  const portfolioBalanceData = hasUsablePortfolioBalanceData ? portfolioBalances.data : undefined

  return { portfolioBalanceData, hasSettledPortfolioBalances }
}

function getCurrencyIds(currencyInfos: ReadonlyArray<{ currencyId: string }> | undefined): string[] {
  return currencyInfos?.map((currencyInfo) => currencyInfo.currencyId) ?? []
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
