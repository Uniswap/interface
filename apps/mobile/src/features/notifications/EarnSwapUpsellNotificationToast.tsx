import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { Flex, Text, TouchableArea } from 'ui/src'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import { X } from 'ui/src/components/icons/X'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import {
  NotificationToast,
  type NotificationToastContentOverrideControls,
} from 'uniswap/src/components/notifications/NotificationToast'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  EarnSwapUpsellSurface,
  getEarnVaultAnalyticsProperties,
  getProjectedMonthlyEarningsUsd,
  logEarnSwapUpsellToastClicked,
  logEarnSwapUpsellToastDismissed,
  logEarnSwapUpsellToastShown,
} from 'uniswap/src/features/earn/analytics'
import { useEarnSwapUpsellState } from 'uniswap/src/features/earn/hooks/useEarnSwapUpsellState'
import { invalidateEarnPortfolioQuery } from 'uniswap/src/features/earn/portfolioInvalidation'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { popNotification } from 'uniswap/src/features/notifications/slice/slice'
import type { EarnSwapUpsellNotification } from 'uniswap/src/features/notifications/slice/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const EARN_SWAP_UPSELL_TOAST_HIDE_DELAY = 8 * ONE_SECOND_MS
const EARN_TOAST_ICON_SIZE = iconSizes.icon36

export function EarnSwapUpsellNotificationToast({
  notification,
}: {
  notification: EarnSwapUpsellNotification
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const dispatch = useDispatch()
  const navigation = useAppStackNavigation()
  const queryClient = useQueryClient()
  const { address, hideDelay, outputCurrencyId, swapAmountUsd, transactionId } = notification
  const shownAnalyticsKeys = useRef(new Set<string>())

  const dismiss = useCallback(() => {
    dispatch(popNotification({ address }))
  }, [address, dispatch])

  const { vault, currencyInfo, shouldRenderToast, recordInteraction } = useEarnSwapUpsellState({
    outputCurrencyId,
    transactionId,
    walletAddress: address,
    onDismiss: dismiss,
  })

  const projectedMonthlyEarningsUsd = useMemo(
    () =>
      getProjectedMonthlyEarningsUsd({
        amountUsd: swapAmountUsd,
        apyPercent: vault?.apyPercent,
      }),
    [swapAmountUsd, vault?.apyPercent],
  )
  const analyticsProperties = useMemo(() => {
    if (!vault) {
      return undefined
    }

    return {
      ...getEarnVaultAnalyticsProperties({
        entryPoint: EarnEntryPoint.PostSwapUpsellToast,
        surface: EarnAnalyticsSurface.Mobile,
        underlyingTokenSymbol: currencyInfo?.currency.symbol,
        vault,
      }),
      output_currency_id: outputCurrencyId,
      projected_monthly_earnings_usd: projectedMonthlyEarningsUsd,
      source_upsell_currency_id: outputCurrencyId,
      swap_amount_usd: swapAmountUsd,
      swap_upsell_surface: EarnSwapUpsellSurface.Toast,
      transaction_id: transactionId,
    }
  }, [
    currencyInfo?.currency.symbol,
    outputCurrencyId,
    projectedMonthlyEarningsUsd,
    swapAmountUsd,
    transactionId,
    vault,
  ])

  useEffect(() => {
    if (!shouldRenderToast || !analyticsProperties || !vault) {
      return
    }

    const analyticsKey = `${transactionId}-${outputCurrencyId}-${vault.id}-${swapAmountUsd ?? ''}`
    if (shownAnalyticsKeys.current.has(analyticsKey)) {
      return
    }

    shownAnalyticsKeys.current.add(analyticsKey)
    logEarnSwapUpsellToastShown(analyticsProperties)
  }, [analyticsProperties, outputCurrencyId, shouldRenderToast, swapAmountUsd, transactionId, vault])

  const handlePress = useCallback(() => {
    if (!vault) {
      return
    }

    if (analyticsProperties) {
      logEarnSwapUpsellToastClicked(analyticsProperties)
    }
    recordInteraction()
    invalidateEarnPortfolioQuery({
      caller: 'EarnSwapUpsellNotificationToast.handlePress',
      evmAddress: address,
      queryClient,
    })
    navigation.navigate(ModalName.EarnDepositAmount, {
      vault,
      analyticsEntryPoint: EarnEntryPoint.PostSwapUpsellToast,
      initialAction: EarnAction.Deposit,
      initialSourceCurrencyId: outputCurrencyId,
      minimumBalanceDataUpdatedAtMs: Date.now(),
      originatingTransactionId: transactionId,
      projectedMonthlyEarningsUsd,
      sourceUpsellCurrencyId: outputCurrencyId,
      swapAmountUsd,
    })
    dismiss()
  }, [
    address,
    analyticsProperties,
    dismiss,
    navigation,
    outputCurrencyId,
    projectedMonthlyEarningsUsd,
    queryClient,
    recordInteraction,
    swapAmountUsd,
    transactionId,
    vault,
  ])

  const handleExplicitDismiss = useCallback(() => {
    if (analyticsProperties) {
      logEarnSwapUpsellToastDismissed(analyticsProperties)
    }
    recordInteraction()
  }, [analyticsProperties, recordInteraction])

  if (!vault || !shouldRenderToast) {
    return null
  }

  const symbol = currencyInfo?.currency.symbol ?? t('common.token.plural')
  const apy = formatPercent(vault.apyPercent)
  const contentOverride = ({ cancelDismiss, dismissLatest }: NotificationToastContentOverrideControls): JSX.Element => (
    <Flex row grow alignItems="center" gap="$spacing12" width="100%">
      <Flex position="relative" width={EARN_TOAST_ICON_SIZE} height={EARN_TOAST_ICON_SIZE} flexShrink={0}>
        <CurrencyLogo hideNetworkLogo currencyInfo={currencyInfo} size={EARN_TOAST_ICON_SIZE} />
        <Flex
          alignItems="center"
          backgroundColor="$accent1"
          borderColor="$surface1"
          borderRadius="$rounded6"
          borderWidth="$spacing1"
          bottom={-3}
          height={16}
          justifyContent="center"
          position="absolute"
          right={-3}
          width={16}
          zIndex={zIndexes.mask}
        >
          <EarnSparkle color="$white" size="$icon.12" />
        </Flex>
      </Flex>
      <Flex shrink flex={1} justifyContent="center" minWidth={0}>
        <Text color="$neutral1" numberOfLines={1} variant="body2">
          {t('explore.earn.title')}{' '}
          <Text color="$accent1" numberOfLines={1} variant="buttonLabel3">
            {apy}
          </Text>{' '}
          {t('explore.earn.toast.onYourToken', { symbol })}
        </Text>
        <Text color="$neutral2" numberOfLines={1} variant="body3">
          {t('explore.earn.toast.subtitle')}
        </Text>
      </Flex>
      <TouchableArea
        p="$spacing4"
        onPress={() => {
          cancelDismiss()
          handleExplicitDismiss()
          dismissLatest()
        }}
      >
        <X color="$neutral2" size={iconSizes.icon16} />
      </TouchableArea>
    </Flex>
  )

  return (
    <NotificationToast
      address={address}
      contentOverride={contentOverride}
      hideDelay={hideDelay ?? EARN_SWAP_UPSELL_TOAST_HIDE_DELAY}
      title={t('explore.earn.toast.title', { apy, symbol })}
      subtitle={t('explore.earn.toast.subtitle')}
      onExplicitDismiss={handleExplicitDismiss}
      onPress={handlePress}
    />
  )
}
