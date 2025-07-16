import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  WrappedLiquidityPositionRangeChart,
  getLiquidityRangeChartProps,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { ErrorCallout } from 'components/ErrorCallout'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { useUpdatedAmountsFromDependentAmount } from 'components/Liquidity/hooks/useDependentAmountFallback'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { useCurrencyInfo } from 'hooks/Tokens'
import useSelectChain from 'hooks/useSelectChain'
import { BaseQuoteFiatAmount } from 'pages/Pool/Positions/create/BaseQuoteFiatAmount'
import {
  useCreatePositionContext,
  useCreateTxContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { PoolOutOfSyncError } from 'pages/Pool/Positions/create/PoolOutOfSyncError'
import { getPoolIdOrAddressFromCreatePositionInfo } from 'pages/Pool/Positions/create/utils'
import { useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Separator, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useAccount } from 'wagmi'

export function CreatePositionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    positionState: { fee, hook },
    derivedPositionInfo,
    currentTransactionStep,
    setCurrentTransactionStep,
  } = useCreatePositionContext()
  const {
    derivedPriceRangeInfo,
    priceRangeState: { priceInverted },
  } = usePriceRangeContext()
  const {
    derivedDepositInfo,
    depositState: { exactField },
  } = useDepositContext()
  const { t } = useTranslation()
  const { creatingPoolOrPair, chainId } = derivedPositionInfo
  const { formattedAmounts, currencyAmounts, currencyAmountsUSDValue } = derivedDepositInfo

  const token0 = currencyAmounts?.TOKEN0?.currency
  const token1 = currencyAmounts?.TOKEN1?.currency
  const token0CurrencyInfo = useCurrencyInfo(token0)
  const token1CurrencyInfo = useCurrencyInfo(token1)

  const { formatNumberOrString, formatCurrencyAmount } = useLocalizationContext()

  const baseCurrency = derivedPriceRangeInfo.price?.baseCurrency
  const quoteCurrency = derivedPriceRangeInfo.price?.quoteCurrency

  const formattedPrices = useMemo(() => {
    if (derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2) {
      return ['', '']
    }

    const { ticksAtLimit, prices } = derivedPriceRangeInfo

    const lowerPriceFormatted = ticksAtLimit[0]
      ? '0'
      : formatNumberOrString({ value: prices[0]?.toSignificant(), type: NumberType.TokenTx })

    const upperPriceFormatted = ticksAtLimit[1]
      ? '∞'
      : formatNumberOrString({ value: prices[1]?.toSignificant(), type: NumberType.TokenTx })

    const postfix = `${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`
    return [`${lowerPriceFormatted} ${postfix}`, `${upperPriceFormatted} ${postfix}`]
  }, [formatNumberOrString, derivedPriceRangeInfo, baseCurrency, quoteCurrency])

  const versionLabel = getProtocolVersionLabel(derivedPriceRangeInfo.protocolVersion)

  const [steps, setSteps] = useState<TransactionStep[]>([])
  const dispatch = useDispatch()
  const { txInfo, gasFeeEstimateUSD, error, refetch, dependentAmount } = useCreateTxContext()
  const account = useAccountMeta()
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const navigate = useNavigate()
  const trace = useTrace()
  const { isSignedInWithPasskey, isSessionAuthenticated, needsPasskeySignin } = useGetPasskeyAuthStatus(
    connectedAccount.connector?.id,
  )

  const onSuccess = useCallback(() => {
    setSteps([])
    setCurrentTransactionStep(undefined)
    onClose()
    navigate('/positions')
  }, [setCurrentTransactionStep, onClose, navigate])

  const liquidityRangeChartProps = useMemo(
    () =>
      getLiquidityRangeChartProps({
        positionInfo: derivedPositionInfo,
        priceRangeInfo: derivedPriceRangeInfo,
        priceInverted,
      }),
    [derivedPositionInfo, derivedPriceRangeInfo, priceInverted],
  )

  const ticks = useMemo(() => {
    if (derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V4) {
      return [derivedPriceRangeInfo.ticks[0], derivedPriceRangeInfo.ticks[1]]
    }
    return []
  }, [derivedPriceRangeInfo])

  const handleCreate = useCallback(() => {
    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (
      !account ||
      account.type !== AccountType.SignerMnemonic ||
      !isValidTx ||
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
        onFailure: () => {
          setCurrentTransactionStep(undefined)
        },
        analytics: {
          ...getLPBaseAnalyticsProperties({
            trace,
            hook,
            version: derivedPriceRangeInfo.protocolVersion,
            tickLower: ticks[0]?.toString(),
            tickUpper: ticks[1]?.toString(),
            fee: fee.feeAmount,
            tickSpacing: fee.tickSpacing,
            currency0: currencyAmounts.TOKEN0.currency,
            currency1: currencyAmounts.TOKEN1.currency,
            currency0AmountUsd: currencyAmountsUSDValue?.TOKEN0,
            currency1AmountUsd: currencyAmountsUSDValue?.TOKEN1,
            poolId: getPoolIdOrAddressFromCreatePositionInfo(derivedPositionInfo),
          }),
          expectedAmountBaseRaw: currencyAmounts.TOKEN0.quotient.toString(),
          expectedAmountQuoteRaw: currencyAmounts.TOKEN1.quotient.toString(),
          createPool: creatingPoolOrPair,
          createPosition: true,
        },
      }),
    )
  }, [
    txInfo,
    account,
    currencyAmounts?.TOKEN0,
    currencyAmounts?.TOKEN1,
    dispatch,
    selectChain,
    startChainId,
    setCurrentTransactionStep,
    onSuccess,
    trace,
    derivedPriceRangeInfo.protocolVersion,
    fee.feeAmount,
    fee.tickSpacing,
    ticks,
    hook,
    currencyAmountsUSDValue?.TOKEN0,
    currencyAmountsUSDValue?.TOKEN1,
    derivedPositionInfo,
    creatingPoolOrPair,
  ])

  const { updatedFormattedAmounts, updatedUSDAmounts } = useUpdatedAmountsFromDependentAmount({
    token0,
    token1,
    dependentAmount,
    exactField,
    currencyAmounts,
    currencyAmountsUSDValue,
    formattedAmounts,
    deposit0Disabled: derivedPriceRangeInfo.deposit0Disabled,
    deposit1Disabled: derivedPriceRangeInfo.deposit1Disabled,
  })

  return (
    <Modal name={ModalName.CreatePosition} padding="$none" onClose={onClose} isDismissible isModalOpen={isOpen}>
      <Flex px="$spacing8" pt="$spacing12" pb="$spacing8" gap="$spacing24">
        <Flex px="$spacing12">
          <GetHelpHeader
            title={
              <Text variant="subheading2" color="$neutral2">
                <Trans i18nKey="position.create.modal.header" />
              </Text>
            }
            closeModal={() => onClose()}
          />
          <Flex py="$spacing12" gap="$spacing12" mt="$spacing16">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex>
                <Flex row gap="$gap8">
                  <Text variant="heading3">{currencyAmounts?.TOKEN0?.currency.symbol}</Text>
                  <Text variant="heading3">/</Text>
                  <Text variant="heading3">{currencyAmounts?.TOKEN1?.currency.symbol}</Text>
                </Flex>
                <Flex row gap={2} alignItems="center">
                  <LiquidityPositionInfoBadges size="small" versionLabel={versionLabel} v4hook={hook} feeTier={fee} />
                </Flex>
              </Flex>
              <DoubleCurrencyLogo
                currencies={[currencyAmounts?.TOKEN0?.currency, currencyAmounts?.TOKEN1?.currency]}
                size={iconSizes.icon36}
              />
            </Flex>
            {(derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V3 ||
              derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V4) && (
              <>
                {!creatingPoolOrPair && !!liquidityRangeChartProps && (
                  <WrappedLiquidityPositionRangeChart width="100%" {...liquidityRangeChartProps} />
                )}
                <Flex row>
                  <Flex fill gap="$gap4">
                    <Text variant="body3" color="$neutral2">
                      <Trans i18nKey="common.min" />
                    </Text>
                    <Text variant="body3">{formattedPrices[0]}</Text>
                  </Flex>
                  <Flex fill gap="$gap4">
                    <Text variant="body3" color="$neutral2">
                      <Trans i18nKey="common.max" />
                    </Text>
                    <Text variant="body3">{formattedPrices[1]}</Text>
                  </Flex>
                </Flex>
              </>
            )}
          </Flex>
          {creatingPoolOrPair && (
            <Flex gap="$spacing12" mt="$spacing32">
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="position.initialPrice" />
              </Text>
              <BaseQuoteFiatAmount
                variant="body1"
                price={derivedPriceRangeInfo.price}
                base={baseCurrency}
                quote={quoteCurrency}
              />
            </Flex>
          )}
          <Flex gap="$spacing12" pb="$spacing8" mt="$spacing32">
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.depositing" />
            </Text>
            <Flex row justifyContent="space-between">
              <Flex gap="$gap4">
                <Flex row gap="$gap8">
                  <Text variant="body1">{updatedFormattedAmounts?.TOKEN0}</Text>
                  <Text variant="body1">{currencyAmounts?.TOKEN0?.currency.symbol}</Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {formatCurrencyAmount({ value: updatedUSDAmounts?.TOKEN0, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <TokenLogo
                size={iconSizes.icon36}
                chainId={currencyAmounts?.TOKEN0?.currency.chainId}
                name={currencyAmounts?.TOKEN0?.currency.name}
                symbol={currencyAmounts?.TOKEN0?.currency.symbol}
                url={token0CurrencyInfo?.logoUrl}
              />
            </Flex>
            <Flex row justifyContent="space-between">
              <Flex gap="$gap4">
                <Flex row gap="$gap8">
                  <Text variant="body1">{updatedFormattedAmounts?.TOKEN1}</Text>
                  <Text variant="body1">{currencyAmounts?.TOKEN1?.currency.symbol}</Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {formatCurrencyAmount({ value: updatedUSDAmounts?.TOKEN1, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <TokenLogo
                size={iconSizes.icon36}
                chainId={currencyAmounts?.TOKEN1?.currency.chainId}
                name={currencyAmounts?.TOKEN1?.currency.name}
                symbol={currencyAmounts?.TOKEN1?.currency.symbol}
                url={token1CurrencyInfo?.logoUrl}
              />
            </Flex>
          </Flex>
          <ErrorCallout errorMessage={error} onPress={refetch} />
          <PoolOutOfSyncError />
        </Flex>
        {currentTransactionStep && steps.length > 1 ? (
          <ProgressIndicator steps={steps} currentStep={currentTransactionStep} />
        ) : (
          <>
            <Separator mx="$padding12" />
            <Flex mx="$padding12">
              <DetailLineItem
                LineItem={{
                  Label: () => (
                    <Text variant="body3" color="$neutral2">
                      <Trans i18nKey="common.networkCost" />
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
            {currentTransactionStep ? (
              <Button size="large" variant="branded" loading={true} key="create-position-confirm" fill={false}>
                {isSignedInWithPasskey ? t('swap.button.submitting.passkey') : t('common.confirmWallet')}
              </Button>
            ) : (
              <Button
                size="large"
                variant="branded"
                onPress={handleCreate}
                isDisabled={!txInfo?.action}
                fill={false}
                icon={needsPasskeySignin ? <Passkey size="$icon.24" /> : undefined}
              >
                {isSignedInWithPasskey && isSessionAuthenticated
                  ? t('position.create.confirm')
                  : t('common.button.create')}
              </Button>
            )}
          </>
        )}
      </Flex>
    </Modal>
  )
}
