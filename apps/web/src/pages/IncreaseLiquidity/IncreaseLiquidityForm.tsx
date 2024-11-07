import { LoaderButton } from 'components/Button/LoaderButton'
import {
  IncreaseLiquidityStep,
  useIncreaseLiquidityContext,
} from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { DepositInputForm } from 'components/Liquidity/DepositInputForm'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { PositionField } from 'types/position'
import { Flex } from 'ui/src'
import { useTranslation } from 'uniswap/src/i18n'

export function IncreaseLiquidityForm() {
  const { t } = useTranslation()

  const { setStep, increaseLiquidityState, derivedIncreaseLiquidityInfo, setIncreaseLiquidityState } =
    useIncreaseLiquidityContext()
  const {
    formattedAmounts,
    currencyAmounts,
    currencyAmountsUSDValue,
    currencyBalances,
    deposit0Disabled,
    deposit1Disabled,
  } = derivedIncreaseLiquidityInfo
  const { position } = increaseLiquidityState
  const { gasFeeEstimateUSD, txInfo } = useIncreaseLiquidityTxContext()

  if (!position) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount, currency1Amount } = position
  const token0 = currency0Amount.currency
  const token1 = currency1Amount.currency

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

  // TODO(WEB-4978): account for gas in this calculation once we have the gasfee
  const insufficientToken0Balance =
    currencyBalances?.TOKEN0 && currencyAmounts?.TOKEN0?.greaterThan(currencyBalances.TOKEN0)
  const insufficientToken1Balance =
    currencyBalances?.TOKEN1 && currencyAmounts?.TOKEN1?.greaterThan(currencyBalances.TOKEN1)

  const disableContinue =
    !currencyAmounts?.TOKEN0 ||
    !currencyBalances?.TOKEN0 ||
    insufficientToken0Balance ||
    !currencyAmounts?.TOKEN1 ||
    !currencyBalances.TOKEN1 ||
    insufficientToken1Balance

  const handleOnContinue = () => {
    if (!disableContinue) {
      setStep(IncreaseLiquidityStep.Review)
    }
  }

  const errorText =
    insufficientToken0Balance && insufficientToken1Balance
      ? t('common.insufficientBalance.error')
      : insufficientToken0Balance || insufficientToken1Balance
        ? t('common.insufficientTokenBalance.error', {
            tokenSymbol: insufficientToken0Balance ? token0.symbol : token1.symbol,
          })
        : undefined

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
          deposit0Disabled={deposit0Disabled}
          deposit1Disabled={deposit1Disabled}
        />
      </Flex>
      <LiquidityModalDetailRows
        currency0Amount={currency0Amount}
        currency1Amount={currency1Amount}
        networkCost={gasFeeEstimateUSD}
      />
      <LoaderButton
        disabled={disableContinue || !txInfo?.txRequest}
        onPress={handleOnContinue}
        loading={Boolean(currencyAmounts?.TOKEN0 && currencyAmounts.TOKEN1 && !txInfo?.txRequest)}
        buttonKey="IncreaseLiquidity-continue"
      >
        {errorText || t('common.add.label')}
      </LoaderButton>
    </>
  )
}
