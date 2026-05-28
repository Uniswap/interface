import { CurrencyAmount } from '@uniswap/sdk-core'
import { ErrorCallout } from 'components/ErrorCallout'
import {
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { canUnwrapCurrency, getCurrencyWithOptionalUnwrap } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Button, Flex, Switch, Text } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'

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
  const { position, exactField } = increaseLiquidityState

  const {
    gasFeeEstimateUSD,
    txInfo,
    error: dataFetchingError,
    refetch,
    dependentAmount,
    fotErrorToken,
  } = useIncreaseLiquidityTxContext()

  if (!position) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount: initialCurrency0Amount, currency1Amount: initialCurrency1Amount } = position

  const canUnwrap0 = canUnwrapCurrency(initialCurrency0Amount.currency, position.version)
  const canUnwrap1 = canUnwrapCurrency(initialCurrency1Amount.currency, position.version)

  const token0 = getCurrencyWithOptionalUnwrap({
    currency: initialCurrency0Amount.currency,
    shouldUnwrap: unwrapNativeCurrency && canUnwrap0,
  })
  const token1 = getCurrencyWithOptionalUnwrap({
    currency: initialCurrency1Amount.currency,
    shouldUnwrap: unwrapNativeCurrency && canUnwrap1,
  })
  const nativeCurrency = nativeOnChain(position.chainId)

  const currency0Amount = useMemo(() => {
    if (unwrapNativeCurrency && canUnwrap0) {
      return CurrencyAmount.fromRawAmount(token0, initialCurrency0Amount.quotient)
    }
    return initialCurrency0Amount
  }, [unwrapNativeCurrency, canUnwrap0, token0, initialCurrency0Amount])

  const currency1Amount = useMemo(() => {
    if (unwrapNativeCurrency && canUnwrap1) {
      return CurrencyAmount.fromRawAmount(token1, initialCurrency1Amount.quotient)
    }
    return initialCurrency1Amount
  }, [unwrapNativeCurrency, canUnwrap1, token1, initialCurrency1Amount])

  const { updatedFormattedAmounts, updatedUSDAmounts } = useUpdatedAmountsFromDependentAmount({
    token0,
    token1,
    dependentAmount,
    exactField,
    currencyAmounts,
    currencyAmountsUSDValue,
    formattedAmounts,
    deposit0Disabled: deposit0Disabled || false,
    deposit1Disabled: deposit1Disabled || false,
  })

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
    return (
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="body3" color="$neutral2">
          {t('pool.addAs', { nativeWrappedSymbol: nativeCurrency.symbol })}
        </Text>
        <Switch
          id="add-as-weth"
          checked={unwrapNativeCurrency}
          onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
          variant="branded"
        />
      </Flex>
    )
  }, [nativeCurrency, t, unwrapNativeCurrency, setUnwrapNativeCurrency])

  const requestLoading = Boolean(
    !dataFetchingError &&
      !error &&
      currencyAmounts?.TOKEN0 &&
      currencyAmounts.TOKEN1 &&
      !txInfo?.txRequest &&
      !fotErrorToken,
  )

  return (
    <Flex gap="$gap24">
      <Flex gap="$gap24">
        <LiquidityPositionInfo positionInfo={position} />
        <DepositInputForm
          token0={token0}
          token1={token1}
          formattedAmounts={updatedFormattedAmounts}
          currencyAmounts={currencyAmounts}
          currencyAmountsUSDValue={updatedUSDAmounts}
          currencyBalances={currencyBalances}
          onUserInput={handleUserInput}
          onSetMax={handleOnSetMax}
          deposit0Disabled={deposit0Disabled}
          deposit1Disabled={deposit1Disabled}
          amount0Loading={requestLoading && exactField === PositionField.TOKEN1} // check isRefetching instead
          amount1Loading={requestLoading && exactField === PositionField.TOKEN0}
          token0UnderCardComponent={canUnwrap0 ? UnwrapNativeCurrencyToggle : undefined}
          token1UnderCardComponent={canUnwrap1 ? UnwrapNativeCurrencyToggle : undefined}
        />
      </Flex>
      <LiquidityModalDetailRows
        currency0Amount={currency0Amount}
        currency1Amount={currency1Amount}
        networkCost={gasFeeEstimateUSD}
      />
      {fotErrorToken && (
        <ErrorCallout
          errorMessage={true}
          title={t('token.safety.warning.fotLow.title')}
          description={t('position.increase.fot', { token: fotErrorToken.currency.symbol })}
        />
      )}
      <ErrorCallout errorMessage={dataFetchingError} onPress={refetch} />
      <Flex row>
        <Button
          isDisabled={Boolean(error) || !txInfo?.txRequest || Boolean(fotErrorToken)}
          onPress={handleOnContinue}
          loading={requestLoading}
          variant="branded"
          key="LoaderButton-animation-IncreaseLiquidity-continue"
          size="large"
        >
          {error || t('common.add.label')}
        </Button>
      </Flex>
    </Flex>
  )
}
