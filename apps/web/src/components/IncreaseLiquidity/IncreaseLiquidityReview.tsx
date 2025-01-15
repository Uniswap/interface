// eslint-disable-next-line no-restricted-imports
import { CurrencyAmount } from '@uniswap/sdk-core'
import { useIncreaseLiquidityContext } from 'components/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'components/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { useGetPoolTokenPercentage, usePositionCurrentPrice } from 'components/Liquidity/hooks'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Separator, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function IncreaseLiquidityReview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const account = useAccountMeta()
  const trace = useTrace()

  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()

  const { derivedIncreaseLiquidityInfo, increaseLiquidityState } = useIncreaseLiquidityContext()
  const { txInfo, gasFeeEstimateUSD } = useIncreaseLiquidityTxContext()

  const { currencyAmounts, currencyAmountsUSDValue } = derivedIncreaseLiquidityInfo

  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()

  if (!increaseLiquidityState.position) {
    throw new Error('a position must be defined')
  }

  const { currency0Amount, currency1Amount, feeTier, chainId } = increaseLiquidityState.position

  const currentPrice = usePositionCurrentPrice(increaseLiquidityState.position)
  const poolTokenPercentage = useGetPoolTokenPercentage(increaseLiquidityState.position)

  const newToken0Amount = useMemo(() => {
    if (!currencyAmounts?.TOKEN0) {
      return undefined
    }

    const additionalToken0Amount = CurrencyAmount.fromRawAmount(
      currencyAmounts?.TOKEN0?.currency,
      currency0Amount.quotient,
    )
    return currencyAmounts?.TOKEN0?.add(additionalToken0Amount)
  }, [currency0Amount, currencyAmounts?.TOKEN0])
  const newToken0AmountUSD = useUSDCValue(newToken0Amount)

  const newToken1Amount = useMemo(() => {
    if (!currencyAmounts?.TOKEN1) {
      return undefined
    }

    const additionalToken1Amount = CurrencyAmount.fromRawAmount(
      currencyAmounts?.TOKEN1?.currency,
      currency1Amount.quotient,
    )
    return currencyAmounts?.TOKEN1?.add(additionalToken1Amount)
  }, [currency1Amount, currencyAmounts?.TOKEN1])
  const newToken1AmountUSD = useUSDCValue(newToken1Amount)

  const onFailure = () => {
    setCurrentStep(undefined)
  }

  const onSuccess = () => {
    setSteps([])
    setCurrentStep(undefined)
    onClose()
  }

  const onIncreaseLiquidity = () => {
    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (
      !account ||
      account?.type !== AccountType.SignerMnemonic ||
      !isValidTx ||
      !increaseLiquidityState.position ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts.TOKEN1
    ) {
      return
    }

    const { version, poolId, currency0Amount, currency1Amount } = increaseLiquidityState.position
    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txInfo,
        setCurrentStep,
        setSteps,
        onSuccess,
        onFailure,
        analytics: {
          ...getLPBaseAnalyticsProperties({
            trace,
            fee: feeTier,
            version,
            poolId,
            currency0: currencyAmounts?.TOKEN0?.currency,
            currency1: currencyAmounts?.TOKEN1?.currency,
            currency0AmountUsd: currencyAmountsUSDValue?.TOKEN0,
            currency1AmountUsd: currencyAmountsUSDValue?.TOKEN1,
            chainId: startChainId,
          }),
          expectedAmountBaseRaw: currency0Amount.quotient?.toString() ?? '0',
          expectedAmountQuoteRaw: currency1Amount.quotient?.toString() ?? '0',
          createPosition: false,
        },
      }),
    )
  }

  return (
    <Flex gap="$gap12">
      <Flex gap="$gap16" px="$padding16" pt="$padding12">
        <TokenInfo currencyAmount={currencyAmounts?.TOKEN0} currencyUSDAmount={currencyAmountsUSDValue?.TOKEN0} />
        <Text variant="body3" color="$neutral2">
          {t('common.and')}
        </Text>
        <TokenInfo currencyAmount={currencyAmounts?.TOKEN1} currencyUSDAmount={currencyAmountsUSDValue?.TOKEN1} />
      </Flex>
      {currentStep ? (
        <ProgressIndicator currentStep={currentStep} steps={steps} />
      ) : (
        <>
          <Separator mx="$padding16" />
          <Flex gap="$gap8" px="$padding16" pb="$padding12">
            <DetailLineItem
              LineItem={{
                Label: () => (
                  <Text variant="body3" color="$neutral2">
                    {t('common.rate')}
                  </Text>
                ),
                Value: () => (
                  <Text variant="body3">{`1 ${currentPrice?.baseCurrency.symbol} = ${currentPrice?.toFixed()} ${currentPrice?.quoteCurrency.symbol}`}</Text>
                ),
              }}
            />
            <DetailLineItem
              LineItem={{
                Label: () => (
                  <Text variant="body3" color="$neutral2">
                    <Trans
                      i18nKey="pool.newSpecificPosition"
                      values={{ symbol: currencyAmounts?.TOKEN0?.currency.symbol }}
                    />
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4">
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: newToken0Amount, type: NumberType.TokenNonTx })}{' '}
                      {getSymbolDisplayText(newToken0Amount?.currency.symbol)}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {`(${formatCurrencyAmount({ value: newToken0AmountUSD, type: NumberType.FiatStandard })})`}
                    </Text>
                  </Flex>
                ),
              }}
            />
            <DetailLineItem
              LineItem={{
                Label: () => (
                  <Text variant="body3" color="$neutral2">
                    <Trans
                      i18nKey="pool.newSpecificPosition"
                      values={{ symbol: currencyAmounts?.TOKEN1?.currency.symbol }}
                    />
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4">
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: newToken1Amount, type: NumberType.TokenNonTx })}{' '}
                      {getSymbolDisplayText(newToken1Amount?.currency.symbol)}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {`(${formatCurrencyAmount({ value: newToken1AmountUSD, type: NumberType.FiatStandard })})`}
                    </Text>
                  </Flex>
                ),
              }}
            />
            {poolTokenPercentage ? (
              <DetailLineItem
                LineItem={{
                  Label: () => (
                    <Text variant="body3" color="$neutral2">
                      {t('addLiquidity.shareOfPool')}
                    </Text>
                  ),
                  Value: () => <Text>{formatPercent(poolTokenPercentage.toFixed())}</Text>,
                }}
              />
            ) : null}
            <DetailLineItem
              LineItem={{
                Label: () => (
                  <Text variant="body3" color="$neutral2">
                    {t('common.networkCost')}
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4" alignItems="center">
                    <NetworkLogo chainId={chainId} size={iconSizes.icon16} shape="square" />
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: gasFeeEstimateUSD, type: NumberType.FiatGasPrice })}
                    </Text>
                  </Flex>
                ),
              }}
            />
          </Flex>
          <Button onPress={onIncreaseLiquidity}>{t('common.confirm')}</Button>
        </>
      )}
    </Flex>
  )
}
