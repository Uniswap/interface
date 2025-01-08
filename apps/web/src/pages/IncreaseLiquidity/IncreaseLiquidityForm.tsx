import { CurrencyAmount } from '@uniswap/sdk-core'
import { LoaderButton } from 'components/Button/LoaderButton'
import {
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { TradingAPIError } from 'pages/Pool/Positions/create/TradingAPIError'
import { useCanUnwrapCurrency, useCurrencyInfoWithUnwrapForTradingApi } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Flex, Switch, Text } from 'ui/src'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

export function IncreaseLiquidityForm() {
  const { t } = useTranslation()

  const {
    setStep,
    increaseLiquidityState,
    derivedIncreaseLiquidityInfo,
    setIncreaseLiquidityState,
    unwrapNativeCurrency,
    setUnwrapNativeCurrency,
  } = useIncreaseLiquidityContext()
  const {
    formattedAmounts,
    currencyAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
    deposit0Disabled,
    deposit1Disabled,
    error,
  } = derivedIncreaseLiquidityInfo
  const { position } = increaseLiquidityState

  const { gasFeeEstimateUSD, txInfo, error: dataFetchingError, refetch } = useIncreaseLiquidityTxContext()

  if (!position) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount: initialCurrency0Amount, currency1Amount: initialCurrency1Amount } = position
  const currency0Info = useCurrencyInfoWithUnwrapForTradingApi({
    currency: initialCurrency0Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })
  const currency1Info = useCurrencyInfoWithUnwrapForTradingApi({
    currency: initialCurrency1Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })

  const token0 = currency0Info?.currency
  const token1 = currency1Info?.currency
  const canUnwrap0 = useCanUnwrapCurrency(initialCurrency0Amount.currency)
  const canUnwrap1 = useCanUnwrapCurrency(initialCurrency1Amount.currency)
  const nativeCurrencyInfo = useNativeCurrencyInfo(position.chainId)

  const currency0Amount = useMemo(() => {
    if (unwrapNativeCurrency && canUnwrap0) {
      return CurrencyAmount.fromRawAmount(currency0Info?.currency, initialCurrency0Amount.quotient)
    }
    return initialCurrency0Amount
  }, [unwrapNativeCurrency, canUnwrap0, currency0Info, initialCurrency0Amount])

  const currency1Amount = useMemo(() => {
    if (unwrapNativeCurrency && canUnwrap1) {
      return CurrencyAmount.fromRawAmount(currency1Info?.currency, initialCurrency1Amount.quotient)
    }
    return initialCurrency1Amount
  }, [unwrapNativeCurrency, canUnwrap1, currency1Info, initialCurrency1Amount])

  const handleUserInput = (field: PositionField, newValue: string) => {
    setIncreaseLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: newValue,
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setIncreaseLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: amount,
    }))
  }

  const handleOnContinue = () => {
    if (!error) {
      setStep(IncreaseLiquidityStep.Review)
    }
  }

  const UnwrapNativeCurrencyToggle = useMemo(() => {
    if (!nativeCurrencyInfo) {
      return null
    }

    return (
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="body3" color="$neutral2">
          {t('pool.addAs', { nativeWrappedSymbol: nativeCurrencyInfo.currency.symbol })}
        </Text>
        <Switch
          id="add-as-weth"
          checked={unwrapNativeCurrency}
          onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
          variant="branded"
        />
      </Flex>
    )
  }, [nativeCurrencyInfo, t, unwrapNativeCurrency, setUnwrapNativeCurrency])

  return (
    <Flex gap="$gap24">
      <Flex gap="$gap24">
        <LiquidityPositionInfo positionInfo={position} />
        <DepositInputForm
          token0={token0}
          token1={token1}
          formattedAmounts={formattedAmounts}
          currencyAmounts={currencyAmounts}
          currencyAmountsUSDValue={currencyAmountsUSDValue}
          currencyBalances={currencyBalances}
          onUserInput={handleUserInput}
          onSetMax={handleOnSetMax}
          deposit0Disabled={deposit0Disabled}
          deposit1Disabled={deposit1Disabled}
          token0UnderCardComponent={canUnwrap0 ? UnwrapNativeCurrencyToggle : undefined}
          token1UnderCardComponent={canUnwrap1 ? UnwrapNativeCurrencyToggle : undefined}
        />
      </Flex>
      <LiquidityModalDetailRows
        currency0Amount={currency0Amount}
        currency1Amount={currency1Amount}
        networkCost={gasFeeEstimateUSD}
      />
      {dataFetchingError && <TradingAPIError refetch={refetch} />}
      <LoaderButton
        disabled={Boolean(error) || !txInfo?.txRequest}
        onPress={handleOnContinue}
        loading={Boolean(
          !dataFetchingError && !error && currencyAmounts?.TOKEN0 && currencyAmounts.TOKEN1 && !txInfo?.txRequest,
        )}
        buttonKey="IncreaseLiquidity-continue"
      >
        <Text variant="buttonLabel1" color="$white">
          {error || t('common.add.label')}
        </Text>
      </LoaderButton>
    </Flex>
  )
}
