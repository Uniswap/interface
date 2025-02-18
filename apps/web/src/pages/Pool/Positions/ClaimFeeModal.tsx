// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { LoaderButton } from 'components/Button/LoaderButton'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { useModalLiquidityInitialState, useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { getProtocolItems } from 'components/Liquidity/utils'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ZERO_ADDRESS } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { TradingAPIError } from 'pages/Pool/Positions/create/TradingAPIError'
import { useCurrencyInfoWithUnwrapForTradingApi } from 'pages/Pool/Positions/create/utils'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCloseModal } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useClaimLpFeesCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useClaimLpFeesCalldataQuery'
import { ClaimLPFeesRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  CollectFeesTxAndGasInfo,
  LiquidityTransactionType,
  isValidLiquidityTxContext,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

// eslint-disable-next-line import/no-unused-modules
export function ClaimFeeModal() {
  const { t } = useTranslation()
  const trace = useTrace()
  const { formatCurrencyAmount } = useLocalizationContext()
  const positionInfo = useModalLiquidityInitialState()
  const account = useAccountMeta()
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()

  const onClose = useCloseModal(ModalName.ClaimFee)
  const {
    feeValue0: token0Fees,
    feeValue1: token1Fees,
    fiatFeeValue0: token0FeesUsd,
    fiatFeeValue1: token1FeesUsd,
  } = useV3OrV4PositionDerivedInfo(positionInfo)

  const chainId = positionInfo?.currency0Amount.currency.chainId

  const currencyInfo0 = useCurrencyInfoWithUnwrapForTradingApi({
    currency: token0Fees?.currency,
    shouldUnwrap: !positionInfo?.collectAsWeth && positionInfo?.version !== ProtocolVersion.V4,
  })
  const currencyInfo1 = useCurrencyInfoWithUnwrapForTradingApi({
    currency: token1Fees?.currency,
    shouldUnwrap: !positionInfo?.collectAsWeth && positionInfo?.version !== ProtocolVersion.V4,
  })
  const dispatch = useAppDispatch()

  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId

  const claimLpFeesParams = useMemo(() => {
    if (!positionInfo || !currencyInfo0 || !currencyInfo1) {
      return undefined
    }

    return {
      simulateTransaction: true,
      protocol: getProtocolItems(positionInfo.version),
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account?.address,
      chainId,
      position: {
        pool: {
          token0: currencyInfo0.currency.isNative ? ZERO_ADDRESS : currencyInfo0.currency.address,
          token1: currencyInfo1.currency.isNative ? ZERO_ADDRESS : currencyInfo1.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
      },
      expectedTokenOwed0RawAmount:
        positionInfo.version !== ProtocolVersion.V4 ? token0Fees?.quotient.toString() : undefined,
      expectedTokenOwed1RawAmount:
        positionInfo.version !== ProtocolVersion.V4 ? token1Fees?.quotient.toString() : undefined,
      collectAsWETH: positionInfo.version !== ProtocolVersion.V4 ? positionInfo.collectAsWeth : undefined,
    } satisfies ClaimLPFeesRequest
  }, [
    account?.address,
    chainId,
    currencyInfo0,
    currencyInfo1,
    positionInfo,
    token0Fees?.quotient,
    token1Fees?.quotient,
  ])

  const {
    data,
    isLoading: calldataLoading,
    error,
    refetch,
  } = useClaimLpFeesCalldataQuery({
    params: claimLpFeesParams,
    enabled: Boolean(claimLpFeesParams),
  })

  // prevent logging of the empty error object for now since those are burying signals
  if (error && Object.keys(error).length > 0) {
    logger.info(
      'ClaimFeeModal',
      'ClaimFeeModal',
      parseErrorMessageTitle(error, { defaultTitle: 'unknown ClaimLPFeesCalldataQuery' }),
      {
        error: JSON.stringify(error),
        claimLpFeesParams: JSON.stringify(claimLpFeesParams),
      },
    )
  }

  const txInfo = useMemo((): CollectFeesTxAndGasInfo | undefined => {
    const validatedTxRequest = validateTransactionRequest(data?.claim)

    if (!positionInfo || !validatedTxRequest) {
      return undefined
    }

    return {
      type: LiquidityTransactionType.Collect,
      protocolVersion: positionInfo?.version,
      action: {
        type: LiquidityTransactionType.Collect,
        currency0Amount: token0Fees || CurrencyAmount.fromRawAmount(positionInfo.currency0Amount.currency, 0),
        currency1Amount: token1Fees || CurrencyAmount.fromRawAmount(positionInfo.currency1Amount.currency, 0),
      },
      txRequest: validatedTxRequest,
    }
  }, [data?.claim, token0Fees, token1Fees, positionInfo])

  return (
    <Modal name={ModalName.ClaimFee} onClose={onClose} isDismissible>
      <Flex gap="$gap16">
        <GetHelpHeader
          link={uniswapUrls.helpRequestUrl}
          title={t('pool.collectFees')}
          closeModal={onClose}
          closeDataTestId="ClaimFeeModal-close-icon"
        />
        {token0Fees && token1Fees && (
          <Flex backgroundColor="$surface3" borderRadius="$rounded12" p="$padding16" gap="$gap12">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currencyInfo0} size={iconSizes.icon24} />
                <Text variant="body1" color="neutral1">
                  {currencyInfo0?.currency.symbol}
                </Text>
              </Flex>
              <Flex row gap="$gap8" alignItems="center">
                <Text variant="body1" color="$neutral1">
                  {formatCurrencyAmount({ value: token0Fees })}
                </Text>
                {token0FeesUsd && (
                  <Text variant="body1" color="$neutral2">
                    ({formatCurrencyAmount({ value: token0FeesUsd, type: NumberType.FiatTokenPrice })})
                  </Text>
                )}
              </Flex>
            </Flex>
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currencyInfo1} size={iconSizes.icon24} />
                <Text variant="body1" color="neutral1">
                  {currencyInfo1?.currency.symbol}
                </Text>
              </Flex>
              <Flex row gap="$gap8" alignItems="center">
                <Text variant="body1" color="$neutral1">
                  {formatCurrencyAmount({ value: token1Fees })}
                </Text>
                {token1FeesUsd && (
                  <Text variant="body1" color="$neutral2">
                    ({formatCurrencyAmount({ value: token1FeesUsd, type: NumberType.FiatTokenPrice })})
                  </Text>
                )}
              </Flex>
            </Flex>
          </Flex>
        )}
        <TradingAPIError errorMessage={getErrorMessageToDisplay({ calldataError: error })} refetch={refetch} />
        <LoaderButton
          buttonKey="ClaimFeeModal-button"
          isDisabled={!data?.claim || Boolean(currentTransactionStep)}
          loading={calldataLoading || Boolean(currentTransactionStep)}
          onPress={async () => {
            const isValidTx = isValidLiquidityTxContext(txInfo)
            if (!account || account?.type !== AccountType.SignerMnemonic || !isValidTx) {
              return
            }

            dispatch(
              liquiditySaga.actions.trigger({
                selectChain,
                startChainId,
                account,
                liquidityTxContext: txInfo,
                setCurrentStep: setCurrentTransactionStep,
                setSteps: () => undefined,
                onSuccess: () => {
                  onClose()
                },
                onFailure: () => {
                  setCurrentTransactionStep(undefined)
                },
                analytics:
                  positionInfo && token0Fees?.currency && token1Fees?.currency
                    ? {
                        ...getLPBaseAnalyticsProperties({
                          trace,
                          poolId: positionInfo.poolId,
                          currency0: token0Fees?.currency,
                          currency1: token1Fees?.currency,
                          currency0AmountUsd: token0FeesUsd,
                          currency1AmountUsd: token1FeesUsd,
                          version: positionInfo?.version,
                        }),
                      }
                    : undefined,
              }),
            )
          }}
        >
          <Text variant="buttonLabel1" color="$neutralContrast">
            {currentTransactionStep ? t('common.confirmWallet') : t('common.collect.button')}
          </Text>
        </LoaderButton>
      </Flex>
    </Modal>
  )
}
