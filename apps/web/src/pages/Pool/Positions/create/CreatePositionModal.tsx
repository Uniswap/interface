// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LoaderButton } from 'components/Button/LoaderButton'
import { ButtonError } from 'components/Button/buttons'
import {
  LiquidityPositionRangeChart,
  getLiquidityRangeChartProps,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
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
import { TradingAPIError } from 'pages/Pool/Positions/create/TradingAPIError'
import { formatPrices } from 'pages/Pool/Positions/create/shared'
import { getInvertedTuple, getPoolIdOrAddressFromCreatePositionInfo } from 'pages/Pool/Positions/create/utils'
import { useCallback, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Separator, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useAccount } from 'wagmi'

export function CreatePositionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    positionState: { fee, hook },
    derivedPositionInfo,
  } = useCreatePositionContext()
  const {
    derivedPriceRangeInfo,
    priceRangeState: { priceInverted },
  } = usePriceRangeContext()
  const { derivedDepositInfo } = useDepositContext()
  const { currencies, protocolVersion, isPoolOutOfSync, creatingPoolOrPair } = derivedPositionInfo
  const { formattedAmounts, currencyAmounts, currencyAmountsUSDValue } = derivedDepositInfo

  const token0CurrencyInfo = useCurrencyInfo(currencyAmounts?.TOKEN0?.currency)
  const token1CurrencyInfo = useCurrencyInfo(currencyAmounts?.TOKEN1?.currency)

  const { formatNumberOrString, formatCurrencyAmount } = useLocalizationContext()
  const [baseCurrency, quoteCurrency] = getInvertedTuple(currencies, priceInverted)

  const { formattedPrices } = useMemo(() => {
    return formatPrices(derivedPriceRangeInfo, formatNumberOrString)
  }, [formatNumberOrString, derivedPriceRangeInfo])

  const versionLabel = getProtocolVersionLabel(protocolVersion)

  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()
  const dispatch = useDispatch()
  const { txInfo, gasFeeEstimateUSD, error, refetch } = useCreateTxContext()
  const account = useAccountMeta()
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId
  const navigate = useNavigate()
  const trace = useTrace()

  const onFailure = () => {
    setCurrentStep(undefined)
  }

  const onSuccess = useCallback(() => {
    setSteps([])
    setCurrentStep(undefined)
    onClose()
    navigate('/positions')
  }, [onClose, navigate])

  const liquidityRangeChartProps = useMemo(
    () =>
      getLiquidityRangeChartProps({
        positionInfo: derivedPositionInfo,
        priceRangeInfo: derivedPriceRangeInfo,
      }),
    [derivedPositionInfo, derivedPriceRangeInfo],
  )

  const handleCreate = useCallback(() => {
    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (
      !account ||
      account?.type !== AccountType.SignerMnemonic ||
      !isValidTx ||
      !currencyAmounts?.TOKEN0 ||
      !currencyAmounts?.TOKEN1
    ) {
      return
    }

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
            version: protocolVersion,
            fee: fee.feeAmount,
            currency0: currencyAmounts.TOKEN0.currency,
            currency1: currencyAmounts.TOKEN1.currency,
            currency0AmountUsd: currencyAmountsUSDValue?.TOKEN0,
            currency1AmountUsd: currencyAmountsUSDValue?.TOKEN1,
            poolId: getPoolIdOrAddressFromCreatePositionInfo(derivedPositionInfo),
            chainId: startChainId,
          }),
          expectedAmountBaseRaw: currencyAmounts.TOKEN0.quotient?.toString() ?? '0',
          expectedAmountQuoteRaw: currencyAmounts.TOKEN1.quotient?.toString() ?? '0',
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
    onSuccess,
    trace,
    protocolVersion,
    fee.feeAmount,
    currencyAmountsUSDValue?.TOKEN0,
    currencyAmountsUSDValue?.TOKEN1,
    creatingPoolOrPair,
    derivedPositionInfo,
  ])

  return (
    <Modal
      name={ModalName.CreatePosition}
      padding="$none"
      onClose={onClose}
      isDismissible
      isModalOpen={isOpen}
      height="max-content"
    >
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
                  <Text variant="heading3">{currencyAmounts?.TOKEN0?.currency?.symbol}</Text>
                  <Text variant="heading3">/</Text>
                  <Text variant="heading3">{currencyAmounts?.TOKEN1?.currency?.symbol}</Text>
                </Flex>
                <Flex row gap={2} alignItems="center">
                  <LiquidityPositionInfoBadges
                    size="small"
                    versionLabel={versionLabel}
                    v4hook={hook}
                    feeTier={fee.feeAmount}
                  />
                </Flex>
              </Flex>
              <DoubleCurrencyLogo
                currencies={[currencyAmounts?.TOKEN0?.currency, currencyAmounts?.TOKEN1?.currency]}
                size={iconSizes.icon36}
              />
            </Flex>
            {(protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4) && (
              <>
                {!creatingPoolOrPair && !!liquidityRangeChartProps && (
                  <LiquidityPositionRangeChart width="100%" {...liquidityRangeChartProps} />
                )}
                <Flex row>
                  <Flex fill gap="$gap4">
                    <Text variant="body3" color="$neutral2">
                      <Trans i18nKey="common.min" />
                    </Text>
                    <Text variant="body3">{`${formattedPrices[0]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
                  </Flex>
                  <Flex fill gap="$gap4">
                    <Text variant="body3" color="$neutral2">
                      <Trans i18nKey="common.max" />
                    </Text>
                    <Text variant="body3">{`${formattedPrices[1]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
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
                price={derivedPriceRangeInfo?.price}
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
                  <Text variant="body1">{formattedAmounts?.TOKEN0}</Text>
                  <Text variant="body1">{currencyAmounts?.TOKEN0?.currency.symbol}</Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {formatCurrencyAmount({ value: currencyAmountsUSDValue?.TOKEN0, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <TokenLogo
                size={iconSizes.icon36}
                chainId={currencyAmounts?.TOKEN0?.currency?.chainId}
                name={currencyAmounts?.TOKEN0?.currency?.name}
                symbol={currencyAmounts?.TOKEN0?.currency?.symbol}
                url={token0CurrencyInfo?.logoUrl}
              />
            </Flex>
            <Flex row justifyContent="space-between">
              <Flex gap="$gap4">
                <Flex row gap="$gap8">
                  <Text variant="body1">{formattedAmounts?.TOKEN1}</Text>
                  <Text variant="body1">{currencyAmounts?.TOKEN1?.currency.symbol}</Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {formatCurrencyAmount({ value: currencyAmountsUSDValue?.TOKEN1, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <TokenLogo
                size={iconSizes.icon36}
                chainId={currencyAmounts?.TOKEN1?.currency?.chainId}
                name={currencyAmounts?.TOKEN1?.currency?.name}
                symbol={currencyAmounts?.TOKEN1?.currency?.symbol}
                url={token1CurrencyInfo?.logoUrl}
              />
            </Flex>
          </Flex>
          {error && <TradingAPIError refetch={refetch} />}
          <PoolOutOfSyncError />
        </Flex>
        {currentStep && steps.length > 1 ? (
          <ProgressIndicator steps={steps} currentStep={currentStep} />
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
                      <NetworkLogo
                        chainId={baseCurrency?.chainId || UniverseChainId.Mainnet}
                        size={iconSizes.icon16}
                        shape="square"
                      />
                      <Text variant="body3">
                        {formatCurrencyAmount({ value: gasFeeEstimateUSD, type: NumberType.FiatGasPrice })}
                      </Text>
                    </Flex>
                  ),
                }}
              />
            </Flex>
            {currentStep ? (
              <LoaderButton disabled={true} loading={true} buttonKey="create-position-confirm">
                <Text variant="buttonLabel1" color="$white">
                  <Trans i18nKey="common.confirmWallet" />
                </Text>
              </LoaderButton>
            ) : !isPoolOutOfSync || !txInfo?.action ? (
              <Button flex={1} py="$spacing16" px="$spacing20" onPress={handleCreate} disabled={!txInfo?.action}>
                <Text variant="buttonLabel1" color="$neutralContrast">
                  <Trans i18nKey="common.button.create" />
                </Text>
              </Button>
            ) : (
              <ButtonError error $borderRadius="20px" onClick={handleCreate}>
                <Trans i18nKey="common.button.create" />
              </ButtonError>
            )}
          </>
        )}
      </Flex>
    </Modal>
  )
}
