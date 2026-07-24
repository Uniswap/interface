import { isWebPlatform } from '@universe/environment'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, SegmentedControl, Text, TouchableArea } from 'ui/src'
import { MessageQuestion } from 'ui/src/components/icons/MessageQuestion'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { getEarnVaultAnalyticsProperties, logEarnVaultCardShowMoreClicked } from 'uniswap/src/features/earn/analytics'
import { BalanceTab } from 'uniswap/src/features/earn/BalanceTab'
import { DetailsTab } from 'uniswap/src/features/earn/DetailsTab'
import { EarnBalanceErrorState } from 'uniswap/src/features/earn/EarnBalanceErrorState'
import type { EarnPositionInfo, EarnVaultInfo, EarnVaultTab } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance } from 'uniswap/src/features/earn/utils'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import type { EarnAnalyticsEntryPoint, EarnAnalyticsSurface } from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { openUri } from 'uniswap/src/utils/linking'

interface EarnVaultOverviewProps {
  analyticsEntryPoint: EarnAnalyticsEntryPoint
  analyticsSurface: EarnAnalyticsSurface
  canWithdraw?: boolean
  onConnectWallet: () => void
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  hasPosition: boolean
  isConnected: boolean
  onClose: () => void
  onDeposit: () => void
  onWithdraw: () => void
  position: EarnPositionInfo | undefined
  selectedTab: EarnVaultTab
  setSelectedTab: (tab: EarnVaultTab) => void
  showActionButtons?: boolean
  showCloseIcon?: boolean
  symbol: string
  vault: EarnVaultInfo
  /** True when the position/balance failed to load; shows the balance error card with retry. */
  balanceError?: boolean
  onRetryBalance?: () => void
  /** Lifetime earnings sourced separately so it can fail without blocking the balance. */
  lifetimeEarningsUsd?: number
  lifetimeEarningsError?: boolean
}

export function EarnVaultOverview({
  analyticsEntryPoint,
  analyticsSurface,
  canWithdraw: canWithdrawProp,
  onConnectWallet,
  currencyInfo,
  hasPosition,
  isConnected,
  onClose,
  onDeposit,
  onWithdraw,
  position,
  selectedTab,
  setSelectedTab,
  showActionButtons = true,
  showCloseIcon = true,
  symbol,
  vault,
  balanceError = false,
  onRetryBalance,
  lifetimeEarningsUsd,
  lifetimeEarningsError,
}: EarnVaultOverviewProps): JSX.Element {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency
  // On error, keep the Balance/Details tabs so the user can retry from the Balance tab.
  const showTabs = hasPosition || balanceError
  const canWithdraw = canWithdrawProp ?? hasConfirmedEarnPositionRawBalance(position)
  const analyticsProperties = useMemo(
    () =>
      getEarnVaultAnalyticsProperties({
        entryPoint: analyticsEntryPoint,
        position,
        surface: analyticsSurface,
        underlyingTokenSymbol: symbol,
        vault,
      }),
    [analyticsEntryPoint, analyticsSurface, position, symbol, vault],
  )
  const onOpenHelp = useCallback(() => {
    openUri({ uri: UniswapHelpUrls.articles.earnHelp, isSafeUri: true }).catch(() => undefined)
  }, [])
  const onShowMore = useCallback(() => {
    logEarnVaultCardShowMoreClicked(analyticsProperties)
  }, [analyticsProperties])

  return (
    <Trace logImpression eventOnTrigger={EarnEventName.EarnVaultDetailViewed} properties={analyticsProperties}>
      <>
        {(isWebPlatform || showCloseIcon) && (
          <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing12">
            {/* Help entry point is web-only; mobile surfaces help elsewhere. */}
            {isWebPlatform && (
              <TouchableArea
                row
                alignItems="center"
                gap="$spacing4"
                borderWidth="$spacing1"
                borderColor="$surface3"
                borderRadius="$rounded12"
                backgroundColor="$surface1"
                px="$spacing8"
                py="$spacing4"
                hoverStyle={{ backgroundColor: '$surface2' }}
                onPress={onOpenHelp}
              >
                <MessageQuestion color="$neutral1" size="$icon.16" />
                <Text variant="buttonLabel4" color="$neutral1">
                  {t('common.help')}
                </Text>
              </TouchableArea>
            )}
            {showCloseIcon && <ModalCloseIcon onClose={onClose} />}
          </Flex>
        )}

        <Flex alignItems="center" gap="$spacing16" pt={isWebPlatform ? '$spacing4' : '$spacing16'}>
          <TokenLogo
            hideNetworkLogo
            url={currencyInfo?.logoUrl}
            size={iconSizes.icon48}
            chainId={currency?.chainId}
            symbol={currency?.symbol}
            name={currency?.name}
          />
          <Flex alignItems="center" gap="$spacing8">
            <Text variant="heading3" color="$neutral1">
              {t('explore.earn.vault.title', { symbol })}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {t('explore.earn.vault.subtitle', { symbol })}
            </Text>
          </Flex>
        </Flex>

        {showTabs && (
          <SegmentedControl<EarnVaultTab>
            fullWidth
            size="large"
            options={[
              { value: 'balance', displayText: t('explore.earn.vault.balance.tab') },
              { value: 'details', displayText: t('explore.earn.vault.details.tab') },
            ]}
            selectedOption={selectedTab}
            onSelectOption={setSelectedTab}
          />
        )}

        {balanceError && selectedTab === 'balance' ? (
          <Flex gap="$spacing16">
            <EarnBalanceErrorState onRetry={onRetryBalance ?? (() => undefined)} />
            {showActionButtons && (
              <Flex row gap="$spacing8">
                <Button emphasis="secondary" size="medium" py="$spacing16" flex={1} onPress={onWithdraw}>
                  {t('explore.earn.vault.withdraw')}
                </Button>
                <Button emphasis="primary" size="medium" py="$spacing16" flex={1} onPress={onDeposit}>
                  {t('explore.earn.vault.deposit')}
                </Button>
              </Flex>
            )}
          </Flex>
        ) : position && selectedTab === 'balance' ? (
          <BalanceTab
            position={position}
            lifetimeEarningsUsd={lifetimeEarningsUsd}
            lifetimeEarningsError={lifetimeEarningsError}
            canWithdraw={canWithdraw}
            showActionButtons={showActionButtons}
            onDeposit={onDeposit}
            onWithdraw={onWithdraw}
          />
        ) : (
          <DetailsTab
            vault={vault}
            hasPosition={hasPosition}
            isConnected={isConnected}
            showActionButtons={showActionButtons}
            onDeposit={onDeposit}
            onConnectWallet={onConnectWallet}
            onShowMore={onShowMore}
          />
        )}
      </>
    </Trace>
  )
}
