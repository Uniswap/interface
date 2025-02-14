// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LoaderButton } from 'components/Button/LoaderButton'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { StyledPercentInput } from 'components/PercentInput'
import {
  DecreaseLiquidityStep,
  useRemoveLiquidityModalContext,
} from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxContext } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { TradingAPIError } from 'pages/Pool/Positions/create/TradingAPIError'
import { useCanUnwrapCurrency } from 'pages/Pool/Positions/create/utils'
import { ClickablePill } from 'pages/Swap/Buy/PredefinedAmount'
import { NumericalInputMimic, NumericalInputSymbolContainer, NumericalInputWrapper } from 'pages/Swap/common/shared'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Switch, Text, useSporeColors } from 'ui/src'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import useResizeObserver from 'use-resize-observer'

const isValidPercentageInput = (value: string): boolean => {
  const numValue = Number(value)
  return !isNaN(numValue) && numValue <= 100
}

export function RemoveLiquidityForm() {
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { percent, positionInfo, setPercent, setStep, percentInvalid, unwrapNativeCurrency, setUnwrapNativeCurrency } =
    useRemoveLiquidityModalContext()
  const { gasFeeEstimateUSD, txContext, error, refetch } = useRemoveLiquidityTxContext()

  if (!positionInfo) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { currency0Amount, currency1Amount } = positionInfo
  const canUnwrap0 = useCanUnwrapCurrency(currency0Amount.currency)
  const canUnwrap1 = useCanUnwrapCurrency(currency1Amount.currency)
  const nativeCurrencyInfo = useNativeCurrencyInfo(positionInfo.chainId)
  const canUnwrap = (canUnwrap0 || canUnwrap1) && positionInfo.version !== ProtocolVersion.V4

  const unwrapUnderCard = useMemo(() => {
    if (!canUnwrap || !nativeCurrencyInfo) {
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
          <Trans i18nKey="pool.withdrawAs" values={{ nativeWrappedSymbol: nativeCurrencyInfo.currency.symbol }} />
        </Text>
        <Switch
          id="add-as-weth"
          checked={unwrapNativeCurrency}
          onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
          variant="branded"
        />
      </Flex>
    )
  }, [canUnwrap, nativeCurrencyInfo, unwrapNativeCurrency, setUnwrapNativeCurrency])

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
            <Trans i18nKey="common.withdrawal.amount" />
          </Text>
          <Flex row alignItems="center" justifyContent="center" width="100%">
            <NumericalInputWrapper width="100%">
              <StyledPercentInput
                value={percent}
                onUserInput={(value: string) => {
                  if (isValidPercentageInput(value)) {
                    setPercent(value)
                  }
                }}
                placeholder="0"
                $width={percent && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
                maxDecimals={0}
                maxLength={3}
              />
              <NumericalInputSymbolContainer showPlaceholder={!percent}>%</NumericalInputSymbolContainer>
              <NumericalInputMimic ref={hiddenObserver.ref}>{percent}</NumericalInputMimic>
            </NumericalInputWrapper>
          </Flex>
          <Flex row gap="$gap8" width="100%" justifyContent="center">
            {[25, 50, 75, 100].map((option) => {
              const active = percent === option.toString()
              const disabled = false
              return (
                <ClickablePill
                  key={option}
                  onPress={() => {
                    setPercent(option.toString())
                  }}
                  $disabled={disabled}
                  $active={active}
                  customBorderColor={colors.surface3.val}
                  foregroundColor={colors[disabled ? 'neutral3' : active ? 'neutral1' : 'neutral2'].val}
                  label={option < 100 ? option + '%' : t('swap.button.max')}
                  px="$spacing16"
                  textVariant="buttonLabel2"
                />
              )
            })}
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
      <TradingAPIError errorMessage={error} refetch={refetch} />
      <LoaderButton
        isDisabled={percentInvalid || !txContext?.txRequest}
        onPress={() => setStep(DecreaseLiquidityStep.Review)}
        loading={!error && !percentInvalid && !txContext?.txRequest}
        buttonKey="RemoveLiquidity-continue"
      >
        <Flex row alignItems="center" gap="$spacing8">
          <Text variant="buttonLabel1" color="$white" animation="fastHeavy">
            {t('common.button.remove')}
          </Text>
        </Flex>
      </LoaderButton>
    </Flex>
  )
}
