import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useShadowPropsMedium } from 'ui/src'
import { EarnSparkle } from 'ui/src/components/icons/EarnSparkle'
import { X } from 'ui/src/components/icons/X'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
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
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { POPUP_MAX_WIDTH } from '~/components/Popups/constants'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { useGlobalEarnVaultModalStore } from '~/features/earn/globalEarnVaultModalStore'

const EARN_TOAST_ICON_SIZE = iconSizes.icon36

type EarnSwapUpsellToastProps = {
  outputCurrencyId: string
  swapAmountUsd?: number
  transactionId: string
  onDismiss: () => void
}

export function EarnSwapUpsellToast({
  outputCurrencyId,
  swapAmountUsd,
  transactionId,
  onDismiss,
}: EarnSwapUpsellToastProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const shadowProps = useShadowPropsMedium()
  const shownAnalyticsKeys = useRef(new Set<string>())
  const queryClient = useQueryClient()
  const openDepositModal = useGlobalEarnVaultModalStore((s) => s.openDepositModal)
  const evmAccount = useActiveAccount(Platform.EVM)
  const { vault, currencyInfo, shouldRenderToast, recordInteraction } = useEarnSwapUpsellState({
    outputCurrencyId,
    transactionId,
    walletAddress: evmAccount?.address,
    onDismiss,
  })

  const symbol = currencyInfo?.currency.symbol ?? t('common.token.plural')
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
        surface: EarnAnalyticsSurface.Web,
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
      caller: 'EarnSwapUpsellToast.handlePress',
      evmAddress: evmAccount?.address,
      queryClient,
    })
    openDepositModal(vault, {
      analyticsEntryPoint: EarnEntryPoint.PostSwapUpsellToast,
      minimumBalanceDataUpdatedAtMs: Date.now(),
      originatingTransactionId: transactionId,
      projectedMonthlyEarningsUsd,
      sourceUpsellCurrencyId: outputCurrencyId,
      swapAmountUsd,
    })
    onDismiss()
  }, [
    analyticsProperties,
    evmAccount?.address,
    onDismiss,
    openDepositModal,
    outputCurrencyId,
    projectedMonthlyEarningsUsd,
    queryClient,
    recordInteraction,
    swapAmountUsd,
    transactionId,
    vault,
  ])

  const handleDismiss = useCallback(() => {
    if (analyticsProperties) {
      logEarnSwapUpsellToastDismissed(analyticsProperties)
    }
    recordInteraction()
    onDismiss()
  }, [analyticsProperties, onDismiss, recordInteraction])

  if (!vault || !shouldRenderToast) {
    return null
  }

  const apy = formatPercent(vault.apyPercent)

  return (
    <Flex
      row
      animation="300ms"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      ml="auto"
      overflow="hidden"
      p="$spacing12"
      position="relative"
      width={POPUP_MAX_WIDTH}
      {...shadowProps}
      $sm={{
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <Flex
        position="absolute"
        left={0}
        top={0}
        width={64}
        height="100%"
        pointerEvents="none"
        $platform-web={{
          background: 'linear-gradient(90deg, rgba(255, 55, 199, 0.10) 0%, rgba(255, 55, 199, 0) 100%)',
        }}
      />
      <TouchableArea onPress={handlePress} flex={1}>
        <Flex row alignItems="center" gap="$gap12" pr="$spacing20">
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
              // TokenLogo sets explicit z-indexes on its layers; without one here the badge
              // stacks behind the token image on web.
              zIndex={zIndexes.mask}
            >
              <EarnSparkle color="$white" size="$icon.12" />
            </Flex>
          </Flex>
          <Flex flex={1} justifyContent="center" minWidth={0}>
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
        </Flex>
      </TouchableArea>
      <Flex position="absolute" right="$spacing12" top="$spacing12">
        <TouchableArea onPress={handleDismiss}>
          <X color="$neutral2" size={iconSizes.icon16} />
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
