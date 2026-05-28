import { useQuery } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import {
  REFERRAL_WHITELIST_POOL_API_URL,
  RoutePoolIdentifier,
  TradeQuote,
  fetchReferralWhitelistData,
  formatPoints,
  getComparableCurrencyAddress,
  getPoolFeeRate,
  getPoolsFromQuote,
  getReferralContext,
  isWhitelistedTradePair,
  type ReferralWhitelistResponse,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/referralRewardUtils'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterface } from 'utilities/src/platform'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type ReferralRewardInfoRowProps = {
  pools: RoutePoolIdentifier[]
}

function getTone({
  t,
  canEarnReferralReward,
  estimatedPoints,
  isLoading,
  isError,
}: {
  t: TFunction
  canEarnReferralReward: boolean
  estimatedPoints?: number
  isLoading: boolean
  isError: boolean
}): {
  backgroundColor: '$statusSuccess2' | '$surface2' | '$accent2'
  borderColor: '$statusSuccess2' | '$surface3' | '$accent2'
  iconColor: '$statusSuccess' | '$neutral2' | '$accent1'
  textColor: '$statusSuccess' | '$neutral1' | '$accent1'
  title: string
  description: string
} {
  if (canEarnReferralReward) {
    return {
      backgroundColor: '$statusSuccess2' as const,
      borderColor: '$statusSuccess2' as const,
      iconColor: '$statusSuccess' as const,
      textColor: '$statusSuccess' as const,
      title: t('referral.swapReward.eligible.title'),
      description: estimatedPoints
        ? t('referral.swapReward.eligible.description.estimated', { points: formatPoints(estimatedPoints) })
        : t('referral.swapReward.eligible.description.whitelist'),
    }
  }

  if (isLoading) {
    return {
      backgroundColor: '$surface2' as const,
      borderColor: '$surface3' as const,
      iconColor: '$neutral2' as const,
      textColor: '$neutral1' as const,
      title: t('referral.swapReward.checking.title'),
      description: t('referral.swapReward.checking.description'),
    }
  }

  if (isError) {
    return {
      backgroundColor: '$surface2' as const,
      borderColor: '$surface3' as const,
      iconColor: '$neutral2' as const,
      textColor: '$neutral1' as const,
      title: t('referral.swapReward.unavailable.title'),
      description: t('referral.swapReward.unavailable.description'),
    }
  }

  return {
    backgroundColor: '$accent2' as const,
    borderColor: '$accent2' as const,
    iconColor: '$accent1' as const,
    textColor: '$accent1' as const,
    title: t('referral.swapReward.ineligible.title'),
    description: t('referral.swapReward.ineligible.description'),
  }
}

function getTradeUsdValue({
  currencyAmountsUSDValue,
  exactCurrencyField,
}: {
  currencyAmountsUSDValue: Record<CurrencyField, { toExact: () => string } | null | undefined>
  exactCurrencyField: CurrencyField
}): number | undefined {
  const preferredTradeUsdValue =
    currencyAmountsUSDValue[exactCurrencyField] ??
    currencyAmountsUSDValue[CurrencyField.INPUT] ??
    currencyAmountsUSDValue[CurrencyField.OUTPUT]

  return preferredTradeUsdValue ? Number(preferredTradeUsdValue.toExact()) : undefined
}

function getEstimatedPoints({
  canEarnReferralReward,
  tradeUsdValue,
  matchedPoolFeeRate,
  tradeReferralCoefficient,
}: {
  canEarnReferralReward: boolean
  tradeUsdValue?: number
  matchedPoolFeeRate?: number
  tradeReferralCoefficient?: number
}): number | undefined {
  if (!(canEarnReferralReward && tradeUsdValue && matchedPoolFeeRate && tradeReferralCoefficient)) {
    return undefined
  }

  return (tradeUsdValue * matchedPoolFeeRate * tradeReferralCoefficient) / 100
}

export function ReferralRewardInfoRow({ pools }: ReferralRewardInfoRowProps): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updateTransactionSettings } = useTransactionSettingsContext()
  const {
    derivedSwapInfo: { chainId, currencies, currencyAmountsUSDValue, exactCurrencyField },
  } = useSwapFormContext()

  const {
    data: whitelistData,
    isLoading,
    isError,
  } = useQuery<ReferralWhitelistResponse>({
    queryKey: [ReactQueryCacheKey.ReferralWhitelistPools, REFERRAL_WHITELIST_POOL_API_URL],
    queryFn: fetchReferralWhitelistData,
    enabled: Boolean(REFERRAL_WHITELIST_POOL_API_URL) && pools.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })

  if (pools.length === 0) {
    return null
  }

  const whitelistPools = whitelistData?.pools ?? []
  const whitelistPairs = whitelistData?.pairs ?? []
  const tradeReferralCoefficient = whitelistData?.tradeReferralCoefficient
  const inputCurrency = currencies[CurrencyField.INPUT]?.currency
  const outputCurrency = currencies[CurrencyField.OUTPUT]?.currency
  const hasWhitelistedPair = isWhitelistedTradePair({
    chainId,
    inputAddress: getComparableCurrencyAddress(inputCurrency),
    outputAddress: getComparableCurrencyAddress(outputCurrency),
    whitelistPairs,
  })

  if (!hasWhitelistedPair) {
    return null
  }

  const { matchedPool, matchedWhitelistPool, canEarnReferralReward } = getReferralContext(pools, whitelistPools)
  const tradeUsdValue = getTradeUsdValue({
    currencyAmountsUSDValue,
    exactCurrencyField,
  })
  const matchedPoolFeeRate = getPoolFeeRate(
    matchedWhitelistPool
      ? {
          address: matchedPool?.address ?? matchedWhitelistPool.address,
          chainId: matchedPool?.chainId ?? matchedWhitelistPool.chainId,
          protocolVersion: matchedWhitelistPool.protocolVersion ?? matchedPool?.protocolVersion,
          feeTier: matchedWhitelistPool.feeTier ?? matchedPool?.feeTier,
        }
      : matchedPool,
  )
  const estimatedPoints = getEstimatedPoints({
    canEarnReferralReward,
    tradeUsdValue,
    matchedPoolFeeRate,
    tradeReferralCoefficient,
  })
  const tone = getTone({ t, canEarnReferralReward, estimatedPoints, isLoading, isError })

  const enableRingV2PoolsOnly = (): void => {
    updateTransactionSettings({
      selectedProtocols: [ProtocolItems.FEW_V2],
      isV4HookPoolsEnabled: false,
      selectedAggregators: [],
    })
  }
  const shouldShowEnableRingV2Button = !canEarnReferralReward && !isLoading && !isError
  const shouldShowViewReferralButton = canEarnReferralReward && isInterface

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      p="$spacing12"
      mb="$spacing8"
      borderRadius="$rounded16"
      borderWidth={1}
      backgroundColor={tone.backgroundColor}
      borderColor={tone.borderColor}
      animation="quick"
      enterStyle={{ opacity: 0, y: -6 }}
    >
      <Flex centered backgroundColor="$surface1" borderRadius="$rounded12" p="$spacing8" $sm={{ display: 'none' }}>
        {canEarnReferralReward ? (
          <CheckCircleFilled color={tone.iconColor} size="$icon.20" />
        ) : (
          <InfoCircleFilled color={tone.iconColor} size="$icon.20" />
        )}
      </Flex>

      <Flex fill gap="$spacing2">
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing8">
          <Text color={tone.textColor} variant="body3" fontWeight="$medium">
            {tone.title}
          </Text>
        </Flex>
        <Text color="$neutral2" variant="body4">
          {tone.description}
        </Text>
      </Flex>
      {shouldShowViewReferralButton && (
        <Button fill={false} emphasis="secondary" size="xsmall" onPress={() => navigate('/referral')}>
          {t('common.button.view')}
        </Button>
      )}
      {shouldShowEnableRingV2Button && (
        <Button fill={false} emphasis="secondary" size="xsmall" onPress={enableRingV2PoolsOnly}>
          {t('referral.swapReward.ineligible.cta')}
        </Button>
      )}
    </Flex>
  )
}

export { getPoolsFromQuote }
export type { TradeQuote }
