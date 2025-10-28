import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ErrorCallout } from 'components/ErrorCallout'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { canUnwrapCurrency } from 'components/Liquidity/utils/currency'
import { getFieldsDisabled } from 'components/Liquidity/utils/priceRangeInfo'
import { IncreaseLiquidityStep, useIncreaseLiquidityContext } from 'pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
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
  const { formattedAmounts, currencyAmounts, currencyAmountsUSDValue, currencyBalances, currencies, error } =
    derivedIncreaseLiquidityInfo
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

  const nativeCurrency = nativeOnChain(position.chainId)

  const { tickLower, tickUpper } = position
  const { TOKEN0: deposit0Disabled, TOKEN1: deposit1Disabled } = getFieldsDisabled({
    ticks: [tickLower, tickUpper],
    poolOrPair: position.version === ProtocolVersion.V2 ? undefined : position.poolOrPair,
  })
  const { updatedFormattedAmounts, updatedUSDAmounts, updatedDeposit0Disabled, updatedDeposit1Disabled } =
    useUpdatedAmountsFromDependentAmount({
      token0: currencies?.TOKEN0,
      token1: currencies?.TOKEN1,
      dependentAmount,
      exactField,
      currencyAmounts,
      currencyAmountsUSDValue,
      formattedAmounts,
      deposit0Disabled,
      deposit1Disabled,
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
          token0={currencies?.TOKEN0}
          token1={currencies?.TOKEN1}
          formattedAmounts={updatedFormattedAmounts}
          currencyAmounts={currencyAmounts}
          currencyAmountsUSDValue={updatedUSDAmounts}
          currencyBalances={currencyBalances}
          onUserInput={handleUserInput}
          onSetMax={handleOnSetMax}
          deposit0Disabled={updatedDeposit0Disabled}
          deposit1Disabled={updatedDeposit1Disabled}
          amount0Loading={requestLoading && exactField === PositionField.TOKEN1} // check isRefetching instead
          amount1Loading={requestLoading && exactField === PositionField.TOKEN0}
          token0UnderCardComponent={canUnwrap0 ? UnwrapNativeCurrencyToggle : undefined}
          token1UnderCardComponent={canUnwrap1 ? UnwrapNativeCurrencyToggle : undefined}
        />
      </Flex>
      <LiquidityModalDetailRows
        currency0Amount={initialCurrency0Amount}
        currency1Amount={initialCurrency1Amount}
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
          {error || t('swap.button.review')}
        </Button>
      </Flex>
    </Flex>
  )
}
