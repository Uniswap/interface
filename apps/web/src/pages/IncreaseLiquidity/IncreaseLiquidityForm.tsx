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
import { PositionField } from 'types/position'
import { Flex, Text } from 'ui/src'
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
    error,
  } = derivedIncreaseLiquidityInfo
  const { position } = increaseLiquidityState

  const { gasFeeEstimateUSD, txInfo, error: dataFetchingError, refetch } = useIncreaseLiquidityTxContext()

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

  const handleOnContinue = () => {
    if (!error) {
      setStep(IncreaseLiquidityStep.Review)
    }
  }

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
