import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useRef } from 'react'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenProtectionFeeOnTransfer } from 'uniswap/src/features/tokens/safetyUtils'

/**
 * Logs an analytics event when there are discrepancies between our backend's and Blockaid's fee-on-transfer (FOT) detection.
 * This data helps the protocols team identify and improve FOT detection accuracy.
 *
 * @param currencyInfo - The result of useCurrencyInfo()
 */
export function useBlockaidFeeComparisonAnalytics(currencyInfo: Maybe<CurrencyInfo>): void {
  const isBlockaidFotLoggingEnabled = useFeatureFlag(FeatureFlags.BlockaidFotLogging)
  const sentEventCurrencyIdRef = useRef<string>()
  const { buyFeePercent, sellFeePercent } = getTokenProtectionFeeOnTransfer(currencyInfo)
  const blockaidBuyFeePercent = currencyInfo?.safetyInfo?.blockaidFees?.buyFeePercent ?? 0
  const blockaidSellFeePercent = currencyInfo?.safetyInfo?.blockaidFees?.sellFeePercent ?? 0

  useEffect(() => {
    if (!currencyInfo || !isBlockaidFotLoggingEnabled) {
      return
    }

    const normalizedBuyFee = buyFeePercent ?? 0
    const normalizedSellFee = sellFeePercent ?? 0

    // Only send if fees are different and we haven't sent for this token before
    if (
      sentEventCurrencyIdRef.current !== currencyInfo.currencyId &&
      currencyInfo.currency.symbol &&
      currencyInfo.currency.chainId &&
      (normalizedBuyFee !== blockaidBuyFeePercent || normalizedSellFee !== blockaidSellFeePercent)
    ) {
      const address = currencyInfo.currency.isToken
        ? currencyInfo.currency.address
        : getNativeAddress(currencyInfo.currency.chainId)

      sendAnalyticsEvent(UniswapEventName.BlockaidFeesMismatch, {
        symbol: currencyInfo.currency.symbol,
        address,
        chainId: currencyInfo.currency.chainId,
        buyFeePercent,
        sellFeePercent,
        blockaidBuyFeePercent: currencyInfo.safetyInfo?.blockaidFees?.buyFeePercent,
        blockaidSellFeePercent: currencyInfo.safetyInfo?.blockaidFees?.sellFeePercent,
        attackType: currencyInfo.safetyInfo?.attackType,
        protectionResult: currencyInfo.safetyInfo?.protectionResult,
      })
      sentEventCurrencyIdRef.current = currencyInfo.currencyId
    }
  }, [
    buyFeePercent,
    sellFeePercent,
    blockaidBuyFeePercent,
    blockaidSellFeePercent,
    currencyInfo,
    isBlockaidFotLoggingEnabled,
  ])
}
