import {
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { PositionField } from 'types/position'
import { Button, Flex } from 'ui/src'
import { useTranslation } from 'uniswap/src/i18n'

export function IncreaseLiquidityForm() {
  const { t } = useTranslation()

  const {
    setStep,
    increaseLiquidityState: addLiquidityState,
    derivedIncreaseLiquidityInfo: derivedAddLiquidityInfo,
    setIncreaseLiquidityState: setAddLiquidityState,
  } = useIncreaseLiquidityContext()
  const { formattedAmounts, currencyAmounts, currencyAmountsUSDValue, currencyBalances } = derivedAddLiquidityInfo
  const { position } = addLiquidityState
  const { gasFeeEstimateUSD } = useIncreaseLiquidityTxContext()

  if (!position) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount, currency1Amount } = position
  const token0 = currency0Amount.currency
  const token1 = currency1Amount.currency

  const handleUserInput = (field: PositionField, newValue: string) => {
    setAddLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: newValue,
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setAddLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: amount,
    }))
  }

  // TODO(WEB-4978): account for gas in this calculation once we have the gasfee
  const disableContinue =
    !currencyAmounts?.TOKEN0 ||
    !currencyBalances?.TOKEN0 ||
    currencyAmounts.TOKEN0.greaterThan(currencyBalances.TOKEN0) ||
    !currencyAmounts?.TOKEN1 ||
    !currencyBalances.TOKEN1 ||
    currencyAmounts?.TOKEN1?.greaterThan(currencyBalances.TOKEN1)

  const handleOnContinue = () => {
    if (!disableContinue) {
      setStep(IncreaseLiquidityStep.Review)
    }
  }

  return (
    <>
      <Flex px="$padding16">
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
        />
      </Flex>
      <LiquidityModalDetailRows
        currency0Amount={currency0Amount}
        currency1Amount={currency1Amount}
        networkCost={gasFeeEstimateUSD}
      />
      <Button disabled={disableContinue} onPress={handleOnContinue}>
        {t('common.add.label')}
      </Button>
    </>
  )
}
