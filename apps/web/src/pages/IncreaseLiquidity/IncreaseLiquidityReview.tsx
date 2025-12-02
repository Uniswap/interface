import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { useGetPoolTokenPercentage } from 'components/Liquidity/hooks/useGetPoolTokenPercentage'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { IncreaseLiquidityStep, useIncreaseLiquidityContext } from 'pages/IncreaseLiquidity/IncreaseLiquidityContext'
import { useIncreaseLiquidityTxContext } from 'pages/IncreaseLiquidity/IncreaseLiquidityTxContext'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Separator, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function IncreaseLiquidityReview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const account = useWallet().evmAccount
  const trace = useTrace()
  const { needsPasskeySignin } = useGetPasskeyAuthStatus(connectedAccount.connector?.id)

  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()

  const {
    setStep,
    derivedIncreaseLiquidityInfo,
    increaseLiquidityState,
    currentTransactionStep,
    setCurrentTransactionStep,
  } = useIncreaseLiquidityContext()
  const { txInfo, gasFeeEstimateUSD, dependentAmount, setTransactionError } = useIncreaseLiquidityTxContext()

  const { exactField } = increaseLiquidityState
  const { currencyAmounts, currencyAmountsUSDValue } = derivedIncreaseLiquidityInfo

  const { updatedCurrencyAmounts, updatedUSDAmounts } = useUpdatedAmountsFromDependentAmount({
    token0: currencyAmounts?.TOKEN0?.currency,
    token1: currencyAmounts?.TOKEN1?.currency,
    dependentAmount,
    exactField,
    currencyAmounts,
    currencyAmountsUSDValue,
  })

  const [steps, setSteps] = useState<TransactionStep[]>([])

  const {
    version,
    poolId,
    currency0Amount,
    currency1Amount,
    feeTier,
    v4hook,
    tickSpacing,
    tickLower,
    tickUpper,
    chainId,
  } = increaseLiquidityState.position ?? {}

  const currentPrice = increaseLiquidityState.position?.poolOrPair?.token1Price
  const poolTokenPercentage = useGetPoolTokenPercentage(increaseLiquidityState.position)

  const newToken0Amount = useMemo(() => {
    if (!updatedCurrencyAmounts?.TOKEN0 || !currency0Amount) {
      return undefined
    }

    const additionalToken0Amount = CurrencyAmount.fromRawAmount(
      updatedCurrencyAmounts.TOKEN0.currency,
      currency0Amount.quotient,
    )
    return updatedCurrencyAmounts.TOKEN0.add(additionalToken0Amount)
  }, [currency0Amount, updatedCurrencyAmounts?.TOKEN0])
  const newToken0AmountUSD = useUSDCValue(newToken0Amount)

  const newToken1Amount = useMemo(() => {
    if (!updatedCurrencyAmounts?.TOKEN1 || !currency1Amount) {
      return undefined
    }

    const additionalToken1Amount = CurrencyAmount.fromRawAmount(
      updatedCurrencyAmounts.TOKEN1.currency,
      currency1Amount.quotient,
    )
    return updatedCurrencyAmounts.TOKEN1.add(additionalToken1Amount)
  }, [currency1Amount, updatedCurrencyAmounts?.TOKEN1])
  const newToken1AmountUSD = useUSDCValue(newToken1Amount)

  const onFailure = (e?: unknown) => {
    if (e) {
      setTransactionError(
        getErrorMessageToDisplay({
          calldataError: e,
        }),
      )
    }
    setStep(IncreaseLiquidityStep.Input)
    setCurrentTransactionStep(undefined)
  }

  const onSuccess = () => {
    setSteps([])
    setCurrentTransactionStep(undefined)
    onClose()
  }

  const onIncreaseLiquidity = () => {
    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (
      !account ||
      !isSignerMnemonicAccountDetails(account) ||
      !isValidTx ||
      !increaseLiquidityState.position ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts.TOKEN1
    ) {
      return
    }

    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txInfo,
        setCurrentStep: setCurrentTransactionStep,
        setSteps,
        onSuccess,
        onFailure,
        analytics: {
          ...getLPBaseAnalyticsProperties({
            trace,
            fee: feeTier?.feeAmount,
            tickSpacing,
            tickLower,
            tickUpper,
            hook: v4hook,
            version: version ?? ProtocolVersion.UNSPECIFIED,
            poolId,
            currency0: currencyAmounts.TOKEN0.currency,
            currency1: currencyAmounts.TOKEN1.currency,
            currency0AmountUsd: updatedUSDAmounts?.TOKEN0,
            currency1AmountUsd: updatedUSDAmounts?.TOKEN1,
          }),
          expectedAmountBaseRaw: updatedCurrencyAmounts?.TOKEN0?.quotient.toString(),
          expectedAmountQuoteRaw: updatedCurrencyAmounts?.TOKEN1?.quotient.toString(),
          createPosition: false,
        },
      }),
    )
  }

  return (
    <Flex gap="$gap12">
      <Flex gap="$gap16" px="$padding16" pt="$padding12">
        <TokenInfo currencyAmount={updatedCurrencyAmounts?.TOKEN0} currencyUSDAmount={updatedUSDAmounts?.TOKEN0} />
        <Text variant="body3" color="$neutral2">
          {t('common.and')}
        </Text>
        <TokenInfo currencyAmount={updatedCurrencyAmounts?.TOKEN1} currencyUSDAmount={updatedUSDAmounts?.TOKEN1} />
      </Flex>
      {currentTransactionStep ? (
        <ProgressIndicator currentStep={currentTransactionStep} steps={steps} />
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
                    <NetworkLogo chainId={chainId ?? null} size={iconSizes.icon16} shape="square" />
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: gasFeeEstimateUSD, type: NumberType.FiatGasPrice })}
                    </Text>
                  </Flex>
                ),
              }}
            />
          </Flex>
          <Flex row>
            <Button
              variant="branded"
              size="large"
              onPress={onIncreaseLiquidity}
              icon={needsPasskeySignin ? <Passkey size="$icon.24" /> : undefined}
            >
              {needsPasskeySignin ? t('common.addLiquidity') : t('common.confirm')}
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  )
}
