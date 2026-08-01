import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Switch, Text } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import useResizeObserver from 'use-resize-observer'
import { ErrorCallout } from '~/components/ErrorCallout'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
} from '~/components/NumericalInput/LargeAmountInput'
import { StyledPercentInput } from '~/components/PercentInput'
import { LiquidityModalDetailRows } from '~/features/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from '~/features/Liquidity/LiquidityPositionInfo'
import { canUnwrapCurrency } from '~/features/Liquidity/utils/currency'
import {
  DecreaseLiquidityStep,
  useRemoveLiquidityModalContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxContext } from '~/pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { PredefinedAmount } from '~/pages/Swap/Buy/PredefinedAmount'

const isValidPercentageInput = (value: string): boolean => {
  const numValue = Number(value)
  return !isNaN(numValue) && numValue <= 100
}

export function RemoveLiquidityForm() {
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const { t } = useTranslation()

  const { percent, positionInfo, setPercent, setStep, percentInvalid, unwrapNativeCurrency, setUnwrapNativeCurrency } =
    useRemoveLiquidityModalContext()
  const { gasFeeEstimateUSD, txContext, error, refetch } = useRemoveLiquidityTxContext()

  if (!positionInfo) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount, currency1Amount } = positionInfo
  const canUnwrap0 = canUnwrapCurrency(currency0Amount.currency, positionInfo.version)
  const canUnwrap1 = canUnwrapCurrency(currency1Amount.currency, positionInfo.version)
  const nativeCurrency = nativeOnChain(positionInfo.chainId)

  const canUnwrap = canUnwrap0 || canUnwrap1

  const unwrapUnderCard = useMemo(() => {
    if (!canUnwrap) {
      return null
    }

    return (
      <Flex
        row
        backgroundColor="$surface2"
        borderBottomLeftRadius="$rounded12"
        borderBottomRightRadius="$rounded12"
        justifyContent="space-between"
        alignItems="center"
        py="$padding8"
        px="$padding16"
      >
        <Text variant="body3" color="$neutral2">
          {t('pool.withdrawAs', { nativeWrappedSymbol: nativeCurrency.symbol ?? t('common.token') })}
        </Text>
        <Switch
          id="add-as-weth"
          checked={unwrapNativeCurrency}
          // oxlint-disable-next-line no-shadow
          onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
          variant="branded"
        />
      </Flex>
    )
  }, [canUnwrap, nativeCurrency, t, unwrapNativeCurrency, setUnwrapNativeCurrency])

  return (
    <Flex gap="$gap24">
      {/* Position info */}
      <Flex width="100%" row justifyContent="flex-start">
        <LiquidityPositionInfo positionInfo={positionInfo} />
      </Flex>
      {/* Percent input panel */}
      <Flex gap="$gap4">
        <Flex
          backgroundColor="$surface2"
          borderTopLeftRadius="$rounded12"
          borderTopRightRadius="$rounded12"
          borderBottomLeftRadius={canUnwrap ? '$rounded0' : '$rounded12'}
          borderBottomRightRadius={canUnwrap ? '$rounded0' : '$rounded12'}
          p="$padding16"
          gap="$gap12"
        >
          <Text variant="body3" color="$neutral2">
            {t('common.withdrawal.amount')}
          </Text>
          <Flex row alignItems="center" justifyContent="center" width="100%">
            <NumericalInputWrapper>
              <StyledPercentInput
                value={percent}
                onUserInput={(value: string) => {
                  if (isValidPercentageInput(value)) {
                    setPercent(value)
                  }
                }}
                placeholder="0"
                fieldWidth={percent && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
                maxDecimals={0}
                maxLength={3}
              />
              <NumericalInputSymbolContainer showPlaceholder={!percent}>%</NumericalInputSymbolContainer>
              <NumericalInputMimic ref={hiddenObserver.ref}>{percent}</NumericalInputMimic>
            </NumericalInputWrapper>
          </Flex>
          <Flex row gap="$gap8" width="100%" justifyContent="center">
            {[25, 50, 75, 100].map((option) => (
              <PredefinedAmount
                key={option}
                onPress={() => {
                  setPercent(option.toString())
                }}
                label={option < 100 ? option + '%' : t('swap.button.max')}
              />
            ))}
          </Flex>
        </Flex>
        {unwrapUnderCard}
      </Flex>
      {/* Detail rows */}
      <LiquidityModalDetailRows
        currency0Amount={currency0Amount}
        currency1Amount={currency1Amount}
        networkCost={gasFeeEstimateUSD}
      />
      <ErrorCallout errorMessage={error} onPress={refetch} />
      <Flex row>
        <Button
          disabled={percentInvalid || !txContext?.txRequest}
          onPress={() => setStep(DecreaseLiquidityStep.Review)}
          loading={!error && !percentInvalid && !txContext?.txRequest}
          variant="branded"
          key="LoaderButton-animation-RemoveLiquidity-continue"
          size="large"
        >
          {t('common.button.review')}
        </Button>
      </Flex>
    </Flex>
  )
}
