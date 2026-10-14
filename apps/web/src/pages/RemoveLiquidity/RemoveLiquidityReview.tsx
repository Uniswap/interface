import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useGetPasskeyAuthStatus } from '@universe/embedded-wallet'
import { Flex, Text } from '@universe/mycelium'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Separator } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { DetailLineItem } from '~/components/DetailLineItem'
import { getLPBaseAnalyticsProperties } from '~/features/Liquidity/analytics'
import { useGetPoolTokenPercentage } from '~/features/Liquidity/hooks/useGetPoolTokenPercentage'
import { TokenInfo } from '~/features/Liquidity/TokenInfo'
import { useCurrencyInfo } from '~/hooks/Tokens'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { useRemoveLiquidityModalContext } from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import { useRemoveLiquidityTxContext } from '~/pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'

export function RemoveLiquidityReview({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const {
    percent,
    positionInfo,
    currencies,
    currentTransactionStep,
    setCurrentTransactionStep,
    commitDecrease,
    resetCommittedDecrease,
  } = useRemoveLiquidityModalContext()
  const [steps, setSteps] = useState<TransactionStep[]>([])
  const removeLiquidityTxContext = useRemoveLiquidityTxContext()
  const { formatCurrencyAmount, formatPercent, convertFiatAmountFormatted } = useLocalizationContext()
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const account = useWallet().evmAccount
  const dispatch = useDispatch()
  const trace = useTrace()
  const { needsPasskeySignin } = useGetPasskeyAuthStatus(connectedAccount.connector?.id)

  const {
    txContext,
    gasFeeEstimateUSD,
    currency0AmountToRemove: unwrappedCurrency0AmountToRemove,
    currency1AmountToRemove: unwrappedCurrency1AmountToRemove,
  } = removeLiquidityTxContext

  const onSuccess = () => {
    setSteps([])
    setCurrentTransactionStep(undefined)
    onClose()
  }

  const onFailure = () => {
    setCurrentTransactionStep(undefined)
    resetCommittedDecrease()
  }

  // The amounts to remove are derived by the tx context from this same position, so they are only unset without one.
  if (!positionInfo || !unwrappedCurrency0AmountToRemove || !unwrappedCurrency1AmountToRemove) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { fee0Amount, fee1Amount } = positionInfo
  const fiatFeeValue0 = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const fiatFeeValue1 = useUSDCValue(fee1Amount, PollingInterval.Slow)

  const {
    currency0Amount,
    currency1Amount,
    chainId,
    feeTier,
    tickSpacing,
    tickLower,
    tickUpper,
    version,
    poolId,
    v4hook,
  } = positionInfo

  const currentPrice = positionInfo.poolOrPair?.token1Price

  const currency0 = currencies?.TOKEN0 ?? positionInfo.currency0Amount.currency
  const currency1 = currencies?.TOKEN1 ?? positionInfo.currency1Amount.currency

  // What remains is the position's share, in its own (wrapped) currencies.
  const { currency0AmountToRemove, currency1AmountToRemove } = useMemo(
    () => ({
      currency0AmountToRemove: currency0Amount.multiply(percent).divide(100),
      currency1AmountToRemove: currency1Amount.multiply(percent).divide(100),
    }),
    [currency0Amount, currency1Amount, percent],
  )

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
    if (!account || !isSignerMnemonicAccountDetails(account) || !isValidTx) {
      return
    }
    commitDecrease(txContext)
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
            fee: feeTier?.feeAmount,
            tickSpacing,
            tickLower,
            tickUpper,
            hook: v4hook,
            poolId,
            currency0,
            currency1,
            currency0AmountUsd: currency0AmountToRemoveUSD,
            currency1AmountUsd: currency1AmountToRemoveUSD,
            version,
          }),
          expectedAmountBaseRaw: unwrappedCurrency0AmountToRemove.quotient.toString(),
          expectedAmountQuoteRaw: unwrappedCurrency1AmountToRemove.quotient.toString(),
          closePosition: percent === '100',
          feeToken0AmountRaw: fee0Amount?.quotient.toString(),
          feeToken1AmountRaw: fee1Amount?.quotient.toString(),
          feeToken0AmountUSD: fiatFeeValue0 ? parseFloat(fiatFeeValue0.toExact()) : undefined,
          feeToken1AmountUSD: fiatFeeValue1 ? parseFloat(fiatFeeValue1.toExact()) : undefined,
        },
      }),
    )
  }

  return (
    <Flex gap="$gap16">
      <Flex gap="$gap16" px="$padding16">
        <TokenInfo currencyAmount={unwrappedCurrency0AmountToRemove} currencyUSDAmount={currency0AmountToRemoveUSD} />
        <Text variant="body3" color="$neutral2">
          {t('common.and')}
        </Text>
        <TokenInfo currencyAmount={unwrappedCurrency1AmountToRemove} currencyUSDAmount={currency1AmountToRemoveUSD} />
        {positionInfo.version !== ProtocolVersion.V2 && (
          <Flex p="$spacing12" gap="$gap12" background="$surface2" borderRadius="$rounded12">
            <Text variant="body4" color="$neutral2">
              {t('fee.uncollected')}
            </Text>

            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currency0CurrencyInfo} size={24} />
                <Text variant="body3">{currency0Amount.currency.symbol} fees</Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3">{formatCurrencyAmount({ value: fee0Amount })}</Text>{' '}
                <Text variant="body3" color="$neutral2">
                  ({convertFiatAmountFormatted(fiatFeeValue0?.toExact(), NumberType.FiatTokenPrice)})
                </Text>
              </Flex>
            </Flex>

            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currency1CurrencyInfo} size={24} />
                <Text variant="body3">{currency1Amount.currency.symbol} fees</Text>
              </Flex>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3">{formatCurrencyAmount({ value: fee1Amount })}</Text>{' '}
                <Text variant="body3" color="$neutral2">
                  ({convertFiatAmountFormatted(fiatFeeValue1?.toExact(), NumberType.FiatTokenPrice)})
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
                    {t('pool.newSpecificPosition', { symbol: currency0Amount.currency.symbol ?? t('common.token') })}
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4">
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: newCurrency0Amount, type: NumberType.TokenNonTx })}{' '}
                      {getSymbolDisplayText(newCurrency0Amount.currency.symbol)}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {`(${convertFiatAmountFormatted(newCurrency0AmountUSD?.toExact(), NumberType.FiatStandard)})`}
                    </Text>
                  </Flex>
                ),
              }}
            />
            <DetailLineItem
              LineItem={{
                Label: () => (
                  <Text variant="body3" color="$neutral2">
                    {t('pool.newSpecificPosition', { symbol: currency1Amount.currency.symbol ?? t('common.token') })}
                  </Text>
                ),
                Value: () => (
                  <Flex row gap="$gap4">
                    <Text variant="body3">
                      {formatCurrencyAmount({ value: newCurrency1Amount, type: NumberType.TokenNonTx })}{' '}
                      {getSymbolDisplayText(newCurrency1Amount.currency.symbol)}
                    </Text>
                    <Text variant="body3" color="$neutral2">
                      {`(${convertFiatAmountFormatted(newCurrency1AmountUSD?.toExact(), NumberType.FiatStandard)})`}
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
                      {convertFiatAmountFormatted(gasFeeEstimateUSD?.toExact(), NumberType.FiatGasPrice)}
                    </Text>
                  </Flex>
                ),
              }}
            />
          </Flex>
          <Flex row>
            <Button
              size="large"
              onPress={onDecreaseLiquidity}
              icon={needsPasskeySignin ? <Passkey size="$icon.24" color="$white" /> : undefined}
            >
              {needsPasskeySignin ? t('pool.removeLiquidity') : t('common.confirm')}
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  )
}
