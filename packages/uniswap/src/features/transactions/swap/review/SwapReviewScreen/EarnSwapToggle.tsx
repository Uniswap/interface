import { isWebPlatform } from '@universe/environment'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  EarnSwapUpsellSurface,
  getEarnVaultAnalyticsProperties,
  logEarnSwapUpsellToggleChanged,
  logEarnSwapUpsellToggleShown,
} from 'uniswap/src/features/earn/analytics'
import { useEarnMinDepositUsd, useEarnSwapToggleMonthlyEarningsThresholdUsd } from 'uniswap/src/features/earn/config'
import { EarnPositionStatus, useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { hasConfirmedEarnPositionRawBalance } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useSwapEarnIntent } from 'uniswap/src/features/transactions/swap/hooks/useSwapEarnIntent'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'

const MONTHS_PER_YEAR = 12

function getUsdValue(value: Maybe<{ toExact: () => string }>): number | undefined {
  const usdValue = Number(value?.toExact())
  return Number.isFinite(usdValue) ? usdValue : undefined
}

function getOutputCurrencyId(
  currency: Maybe<{ address?: string; chainId: number; isNative: boolean }>,
): string | undefined {
  if (!currency) {
    return undefined
  }

  return `${currency.chainId}-${currency.isNative ? 'native' : currency.address}`
}

export function EarnSwapToggle(): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const shownEventKeyRef = useRef<string | undefined>(undefined)
  const minDepositUsd = useEarnMinDepositUsd()
  const monthlyEarningsThresholdUsd = useEarnSwapToggleMonthlyEarningsThresholdUsd()
  const { exactCurrencyField, isEarnFlow, updateSwapForm } = useSwapFormStore((s) => ({
    exactCurrencyField: s.exactCurrencyField,
    isEarnFlow: s.isEarnFlow ?? false,
    updateSwapForm: s.updateSwapForm,
  }))
  const { currencies, currencyAmountsUSDValue } = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencies: s.currencies,
    currencyAmountsUSDValue: s.currencyAmountsUSDValue,
  }))
  const currencyIn = currencies[CurrencyField.INPUT]?.currency
  const currencyOut = currencies[CurrencyField.OUTPUT]?.currency
  const evmAccount = useActiveAccount(Platform.EVM)

  // Earn deposits are exact-input only; the toggle is unavailable when the user is specifying
  // the output (deposit) amount.
  const { isEligible, vault } = useSwapEarnIntent({
    currencyIn,
    currencyOut,
    enabled: exactCurrencyField === CurrencyField.INPUT,
  })
  const { position, positionStatus } = useEarnPosition({
    vault,
    walletAddress: evmAccount?.address,
    isConnected: !!evmAccount,
    enabled: isEligible && !!vault,
  })
  const hasActivePosition = hasConfirmedEarnPositionRawBalance(position)
  const hasResolvedNoActivePosition =
    positionStatus === EarnPositionStatus.NoPosition ||
    (positionStatus === EarnPositionStatus.Present && !hasActivePosition)
  const inputUsdValue = getUsdValue(currencyAmountsUSDValue[CurrencyField.INPUT])
  const outputUsdValue = getUsdValue(currencyAmountsUSDValue[CurrencyField.OUTPUT])
  const swapUsdValue = inputUsdValue ?? outputUsdValue
  // The toggle turns a swap into an Earn deposit, so gate on the estimated deposited value.
  const depositUsdValue = outputUsdValue ?? inputUsdValue
  const hasResolvedDepositUsdValue = depositUsdValue !== undefined
  const meetsMinimumDeposit = hasResolvedDepositUsdValue && depositUsdValue >= minDepositUsd
  const projectedMonthlyEarningsUsd =
    depositUsdValue !== undefined ? (depositUsdValue * (vault?.apyPercent ?? 0)) / 100 / MONTHS_PER_YEAR : undefined
  const outputCurrencyId = getOutputCurrencyId(currencyOut)
  const toggleState = isEarnFlow ? ('on' as const) : ('off' as const)
  const analyticsProperties = useMemo(
    () =>
      vault
        ? {
            ...getEarnVaultAnalyticsProperties({
              entryPoint: EarnEntryPoint.SwapReviewToggle,
              position,
              surface: isWebPlatform ? EarnAnalyticsSurface.Web : EarnAnalyticsSurface.Mobile,
              underlyingTokenSymbol: currencyOut?.symbol,
              vault,
            }),
            output_currency_id: outputCurrencyId,
            projected_monthly_earnings_usd: projectedMonthlyEarningsUsd,
            swap_amount_usd: swapUsdValue,
            swap_upsell_surface: EarnSwapUpsellSurface.Toggle,
            toggle_state: toggleState,
          }
        : undefined,
    [currencyOut?.symbol, outputCurrencyId, position, projectedMonthlyEarningsUsd, swapUsdValue, toggleState, vault],
  )

  // Only clear the user's earn intent on a *confirmed* ineligible state: the currency pair stopped being
  // earn-eligible, or we positively know there is no active position. A pending or transiently-errored position
  // lookup (`loading`/`error`) must not silently convert a reviewed "Swap and deposit" into a plain swap.
  useEffect(() => {
    const shouldClearForMinimumDeposit = hasResolvedDepositUsdValue && !meetsMinimumDeposit
    if (isEarnFlow && (!isEligible || hasResolvedNoActivePosition || shouldClearForMinimumDeposit)) {
      updateSwapForm({ isEarnFlow: false, earnSwapUpsellAnalyticsProperties: undefined })
    }
  }, [
    hasResolvedDepositUsdValue,
    hasResolvedNoActivePosition,
    isEarnFlow,
    isEligible,
    meetsMinimumDeposit,
    updateSwapForm,
  ])

  useEffect(() => {
    if (!isEarnFlow) {
      return
    }

    updateSwapForm({
      earnSwapUpsellAnalyticsProperties: analyticsProperties
        ? {
            ...analyticsProperties,
            toggle_state: 'on',
          }
        : undefined,
    })
  }, [analyticsProperties, isEarnFlow, updateSwapForm])

  useEffect(() => {
    if (!analyticsProperties || !isEligible || !vault || !currencyOut || !hasActivePosition || !meetsMinimumDeposit) {
      return
    }

    const eventKey = [
      vault.id,
      outputCurrencyId ?? currencyOut.symbol ?? '',
      swapUsdValue,
      projectedMonthlyEarningsUsd,
    ].join(':')
    if (shownEventKeyRef.current === eventKey) {
      return
    }

    shownEventKeyRef.current = eventKey
    logEarnSwapUpsellToggleShown(analyticsProperties)
  }, [
    analyticsProperties,
    currencyOut,
    hasActivePosition,
    isEligible,
    meetsMinimumDeposit,
    outputCurrencyId,
    projectedMonthlyEarningsUsd,
    swapUsdValue,
    vault,
  ])

  const onCheckedChange = useCallback(
    (checked: boolean): void => {
      if (analyticsProperties) {
        logEarnSwapUpsellToggleChanged({
          ...analyticsProperties,
          toggle_state: checked ? 'on' : 'off',
        })
      }
      updateSwapForm({
        isEarnFlow: checked,
        earnSwapUpsellAnalyticsProperties:
          checked && analyticsProperties ? { ...analyticsProperties, toggle_state: 'on' } : undefined,
      })
    },
    [analyticsProperties, updateSwapForm],
  )

  if (!isEligible || !vault || !currencyOut || !hasActivePosition || !meetsMinimumDeposit) {
    return null
  }

  const apyLabel = t('explore.earn.vault.rateValue', {
    apy: formatPercent(vault.apyPercent),
  })
  const projectedMonthlyEarningsLabel =
    swapUsdValue !== undefined &&
    projectedMonthlyEarningsUsd !== undefined &&
    swapUsdValue >= monthlyEarningsThresholdUsd
      ? t('explore.earn.swapToggle.monthlyEarnings', {
          amount: convertFiatAmountFormatted(projectedMonthlyEarningsUsd, NumberType.FiatTokenQuantity),
        })
      : undefined
  const symbol = currencyOut.symbol ?? t('common.token.plural')

  return (
    <Flex
      backgroundColor={isEarnFlow ? '$accent2' : '$surface2'}
      borderRadius="$rounded20"
      mb={isWebPlatform ? '$spacing8' : '$spacing16'}
      px="$spacing8"
      pt={isWebPlatform ? '$spacing8' : '$spacing4'}
      pb="$spacing8"
    >
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        gap="$spacing8"
        minHeight={54}
        pl="$spacing12"
        pr="$spacing8"
        py="$spacing8"
        borderRadius="$rounded12"
      >
        <Flex shrink gap="$spacing4">
          <Flex row flexWrap="wrap" alignItems="center" gap="$spacing2">
            <Text color="$neutral1" variant="body3">
              {t('explore.earn.title')}
            </Text>
            <Text color="$accent1" variant="buttonLabel3">
              {projectedMonthlyEarningsLabel ?? apyLabel}
            </Text>
            <Text color="$neutral1" variant="body3">
              {t('explore.earn.swapToggle.onToken', { symbol })}
            </Text>
          </Flex>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral2" variant="body4">
              {t('explore.earn.swapToggle.subtitle')}
            </Text>
            {isWebPlatform ? (
              <InfoTooltip
                text={t('explore.earn.swapToggle.tooltip')}
                placement="top"
                trigger={<InfoCircleFilled color="$neutral3" size="$icon.12" />}
              />
            ) : (
              <InfoCircleFilled color="$neutral3" size="$icon.12" />
            )}
          </Flex>
        </Flex>
        <Switch
          checked={isEarnFlow}
          testID="earn-swap-toggle-switch"
          variant="branded"
          onCheckedChange={onCheckedChange}
        />
      </Flex>
    </Flex>
  )
}
