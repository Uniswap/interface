import { TokenInfo } from 'components/Liquidity/TokenInfo'
import {
  useGetPoolTokenPercentage,
  usePositionCurrentPrice,
  useV3OrV4PositionDerivedInfo,
} from 'components/Liquidity/hooks'
import { useLiquidityModalContext } from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxContext } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Separator, Text } from 'ui/src'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export function RemoveLiquidityReview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [steps, setSteps] = useState<TransactionStep[]>([])
  const { percent, positionInfo } = useLiquidityModalContext()
  const removeLiquidityTxContext = useRemoveLiquidityTxContext()
  const { formatCurrencyAmount, formatPercent } = useLocalizationContext()
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()
  const currency0FiatAmount = useUSDCValue(positionInfo?.currency0Amount) ?? undefined
  const currency1FiatAmount = useUSDCValue(positionInfo?.currency1Amount) ?? undefined
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const account = useAccountMeta()
  const dispatch = useDispatch()

  const { txContext, gasFeeEstimateUSD } = removeLiquidityTxContext

  const onFailure = () => {
    setCurrentStep(undefined)
  }

  const onDecreaseLiquidity = () => {
    const isValidTx = isValidLiquidityTxContext(txContext)
    if (!account || account?.type !== AccountType.SignerMnemonic || !isValidTx) {
      return
    }
    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: txContext,
        setCurrentStep,
        setSteps,
        onSuccess: onClose,
        onFailure,
      }),
    )
  }

  if (!positionInfo) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { feeValue0, feeValue1, fiatFeeValue0, fiatFeeValue1 } = useV3OrV4PositionDerivedInfo(positionInfo)

  const { currency0Amount, currency1Amount } = positionInfo

  const currentPrice = usePositionCurrentPrice(positionInfo)

  const currency0AmountToRemove = currency0Amount.multiply(percent).divide(100)
  const currency1AmountToRemove = currency1Amount.multiply(percent).divide(100)

  const newCurrency0Amount = currency0Amount.subtract(currency0AmountToRemove)
  const newCurrency1Amount = currency1Amount.subtract(currency1AmountToRemove)

  const newCurrency0AmountUSD = useUSDCValue(newCurrency0Amount)
  const newCurrency1AmountUSD = useUSDCValue(newCurrency1Amount)

  const poolTokenPercentage = useGetPoolTokenPercentage(positionInfo)

  const currency0CurrencyInfo = useCurrencyInfo(currency0Amount.currency)
  const currency1CurrencyInfo = useCurrencyInfo(currency1Amount.currency)

  return (
    <Flex gap="$gap16">
      <Flex gap="$gap16" px="$padding16">
        <TokenInfo
          currencyAmount={currency0AmountToRemove}
          currencyUSDAmount={currency0FiatAmount?.multiply(percent).divide(100)}
        />
        <Text variant="body3" color="$neutral2">
          {t('common.and')}
        </Text>
        <TokenInfo
          currencyAmount={currency1AmountToRemove}
          currencyUSDAmount={currency1FiatAmount?.multiply(percent).divide(100)}
        />
        <Flex p="$spacing16" gap="$gap12" background="$surface2" borderRadius="$rounded12">
          <Text variant="body4" color="$neutral2">
            Includes accrued fees:
          </Text>

          <Flex row gap alignItems="center" justifyContent="space-between">
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

          <Flex row gap alignItems="center" justifyContent="space-between">
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
      </Flex>
      {currentStep ? (
        <ProgressIndicator steps={steps} currentStep={currentStep} />
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
                  <Text variant="body3">
                    {formatCurrencyAmount({ value: gasFeeEstimateUSD, type: NumberType.FiatGasPrice })}
                  </Text>
                ),
              }}
            />
          </Flex>
          <Button onPress={onDecreaseLiquidity}>{t('common.confirm')}</Button>
        </>
      )}
    </Flex>
  )
}
