import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { TokenInfo } from 'components/Liquidity/TokenInfo'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import {
  useGetPoolTokenPercentage,
  usePositionCurrentPrice,
  useV3OrV4PositionDerivedInfo,
} from 'components/Liquidity/hooks'
import { useRemoveLiquidityModalContext } from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxContext } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { getCurrencyWithOptionalUnwrap } from 'pages/Pool/Positions/create/utils'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Separator, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
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

export function RemoveLiquidityReview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { percent, positionInfo, unwrapNativeCurrency, currentTransactionStep, setCurrentTransactionStep } =
    useRemoveLiquidityModalContext()
  const [steps, setSteps] = useState<TransactionStep[]>([])
  const removeLiquidityTxContext = useRemoveLiquidityTxContext()
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const currency0FiatAmount = useUSDCValue(positionInfo?.currency0Amount) ?? undefined
  const currency1FiatAmount = useUSDCValue(positionInfo?.currency1Amount) ?? undefined
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const account = useAccountMeta()
  const dispatch = useDispatch()
  const trace = useTrace()

  const { txContext, gasFeeEstimateUSD } = removeLiquidityTxContext

  const onSuccess = () => {
    setSteps([])
    setCurrentTransactionStep(undefined)
    onClose()
  }

  const onFailure = () => {
    setCurrentTransactionStep(undefined)
  }

  if (!positionInfo) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { feeValue0, feeValue1, fiatFeeValue0, fiatFeeValue1 } = useV3OrV4PositionDerivedInfo(positionInfo)

  const { currency0Amount, currency1Amount, chainId, feeTier, version, poolId } = positionInfo

  const currentPrice = usePositionCurrentPrice(positionInfo)

  const currency0 = getCurrencyWithOptionalUnwrap({
    currency: positionInfo?.currency0Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })
  const currency1 = getCurrencyWithOptionalUnwrap({
    currency: positionInfo?.currency1Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })

  const {
    unwrappedCurrency0AmountToRemove,
    unwrappedCurrency1AmountToRemove,
    currency0AmountToRemove,
    currency1AmountToRemove,
  } = useMemo(() => {
    const unwrappedCurrency0AmountToRemove = CurrencyAmount.fromRawAmount(currency0, currency0Amount.quotient)
      .multiply(percent)
      .divide(100)
    const unwrappedCurrency1AmountToRemove = CurrencyAmount.fromRawAmount(currency1, currency1Amount.quotient)
      .multiply(percent)
      .divide(100)

    const currency0AmountToRemove = currency0Amount.multiply(percent).divide(100)
    const currency1AmountToRemove = currency1Amount.multiply(percent).divide(100)

    return {
      unwrappedCurrency0AmountToRemove,
      unwrappedCurrency1AmountToRemove,
      currency0AmountToRemove,
      currency1AmountToRemove,
    }
  }, [currency0Amount, currency0, currency1Amount, currency1, percent])

  const currency0AmountToRemoveUSD = useUSDCValue(unwrappedCurrency0AmountToRemove)
  const currency1AmountToRemoveUSD = useUSDCValue(unwrappedCurrency1AmountToRemove)

  const newCurrency0Amount = currency0Amount.subtract(currency0AmountToRemove)
  const newCurrency1Amount = currency1Amount.subtract(currency1AmountToRemove)

  const newCurrency0AmountUSD = useUSDCValue(newCurrency0Amount)
  const newCurrency1AmountUSD = useUSDCValue(newCurrency1Amount)

  const poolTokenPercentage = useGetPoolTokenPercentage(positionInfo)

  const currency0CurrencyInfo = useCurrencyInfo(currency0Amount.currency)
  const currency1CurrencyInfo = useCurrencyInfo(currency1Amount.currency)

  const onDecreaseLiquidity = () => {
    const isValidTx = isValidLiquidityTxContext(txContext)
    if (!account || account?.type !== AccountType.SignerMnemonic || !isValidTx || !positionInfo) {
      return
    }
    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txContext,
        setCurrentStep: setCurrentTransactionStep,
        setSteps,
        onSuccess,
        onFailure,
        analytics: {
          ...getLPBaseAnalyticsProperties({
            trace,
            fee: feeTier,
            poolId,
            currency0,
            currency1,
            currency0AmountUsd: currency0AmountToRemoveUSD,
            currency1AmountUsd: currency1AmountToRemoveUSD,
            version,
          }),
          expectedAmountBaseRaw: unwrappedCurrency0AmountToRemove?.quotient.toString() ?? '-',
          expectedAmountQuoteRaw: unwrappedCurrency1AmountToRemove?.quotient.toString() ?? '-',
          closePosition: percent === '100',
        },
      }),
    )
  }

  return (
    <Flex gap="$gap16">
      <Flex gap="$gap16" px="$padding16">
        <TokenInfo
          currencyAmount={unwrappedCurrency0AmountToRemove}
          currencyUSDAmount={currency0FiatAmount?.multiply(percent).divide(100)}
        />
        <Text variant="body3" color="$neutral2">
          {t('common.and')}
        </Text>
        <TokenInfo
          currencyAmount={unwrappedCurrency1AmountToRemove}
          currencyUSDAmount={currency1FiatAmount?.multiply(percent).divide(100)}
        />
        {positionInfo.version !== ProtocolVersion.V2 && (
          <Flex p="$spacing16" gap="$gap12" background="$surface2" borderRadius="$rounded12">
            <Text variant="body4" color="$neutral2">
              {t('fee.uncollected')}
            </Text>

            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currency0CurrencyInfo} size={24} />
                <Text variant="body3">{currency0Amount.currency.symbol} fees</Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3">{formatCurrencyAmount({ value: feeValue0 })}</Text>{' '}
                <Text variant="body3" color="$neutral2">
                  ({formatCurrencyAmount({ value: fiatFeeValue0, type: NumberType.FiatTokenPrice })})
                </Text>
              </Flex>
            </Flex>

            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currency1CurrencyInfo} size={24} />
                <Text variant="body3">{currency1Amount.currency.symbol} fees</Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3">{formatCurrencyAmount({ value: feeValue1 })}</Text>{' '}
                <Text variant="body3" color="$neutral2">
                  ({formatCurrencyAmount({ value: fiatFeeValue1, type: NumberType.FiatTokenPrice })})
                </Text>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Flex>
      {currentTransactionStep ? (
        <ProgressIndicator steps={steps} currentStep={currentTransactionStep} />
      ) : (
        <>
          <Separator mx="$padding16" />
          <Flex gap="$gap8" px="$padding16">
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
                    <Trans i18nKey="pool.newSpecificPosition" values={{ symbol: currency0Amount.currency.symbol }} />
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4">
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: newCurrency0Amount, type: NumberType.TokenNonTx })}{' '}
                      {getSymbolDisplayText(newCurrency0Amount?.currency.symbol)}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {`(${formatCurrencyAmount({ value: newCurrency0AmountUSD, type: NumberType.FiatStandard })})`}
                    </Text>
                  </Flex>
                ),
              }}
            />
            <DetailLineItem
              LineItem={{
                Label: () => (
                  <Text variant="body3" color="$neutral2">
                    <Trans i18nKey="pool.newSpecificPosition" values={{ symbol: currency1Amount.currency.symbol }} />
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4">
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: newCurrency1Amount, type: NumberType.TokenNonTx })}{' '}
                      {getSymbolDisplayText(newCurrency1Amount?.currency.symbol)}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {`(${formatCurrencyAmount({ value: newCurrency1AmountUSD, type: NumberType.FiatStandard })})`}
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
                  Value: () => <Text variant="body3">{formatPercent(poolTokenPercentage.toFixed())}</Text>,
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
          <Flex row>
            <Button size="large" onPress={onDecreaseLiquidity}>
              {t('common.confirm')}
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  )
}
