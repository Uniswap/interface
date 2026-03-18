import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ClaimLPFeesRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import {
  V2Pool,
  V2Position,
  V3Pool,
  V3Position,
  V4Pool,
  V4Position,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, Switch, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { PollingInterval, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import {
  CollectFeesTxAndGasInfo,
  isValidLiquidityTxContext,
  LiquidityTransactionType,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ErrorCallout } from '~/components/ErrorCallout'
import { getLPBaseAnalyticsProperties } from '~/components/Liquidity/analytics'
import { PositionInfo } from '~/components/Liquidity/types'
import { canUnwrapCurrency, getCurrencyWithOptionalUnwrap } from '~/components/Liquidity/utils/currency'
import { getProtocols } from '~/components/Liquidity/utils/protocolVersion'
import { useAccount } from '~/hooks/useAccount'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { useModalState } from '~/hooks/useModalState'
import useSelectChain from '~/hooks/useSelectChain'
import { useAppDispatch } from '~/state/hooks'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'

function getProtocolCase(
  version: ProtocolVersion,
): 'v2ClaimLpFeesRequest' | 'v3ClaimLpFeesRequest' | 'v4ClaimLpFeesRequest' | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2ClaimLpFeesRequest'
    case ProtocolVersion.V3:
      return 'v3ClaimLpFeesRequest'
    case ProtocolVersion.V4:
      return 'v4ClaimLpFeesRequest'
    default:
      return undefined
  }
}

function getClaimLpFeesRequest({
  currency0,
  currency1,
  positionInfo,
  unwrapNativeCurrency,
  address,
}: {
  currency0: Currency
  currency1: Currency
  positionInfo: PositionInfo
  unwrapNativeCurrency: boolean
  address: string | undefined
}): ClaimLPFeesRequest | undefined {
  const protocolCase = getProtocolCase(positionInfo.version)

  if (!protocolCase || !address) {
    return undefined
  }

  if (protocolCase === 'v2ClaimLpFeesRequest') {
    return new ClaimLPFeesRequest({
      claimLPFeesRequest: {
        case: protocolCase,
        value: {
          simulateTransaction: true,
          protocol: getProtocols(positionInfo.version),
          position: new V2Position({
            pool: new V2Pool({
              token0: currency0.isNative ? ZERO_ADDRESS : currency0.address,
              token1: currency1.isNative ? ZERO_ADDRESS : currency1.address,
            }),
          }),
          walletAddress: address,
          chainId: currency0.chainId,
          collectAsWETH: !unwrapNativeCurrency,
        },
      },
    })
  }

  if (!positionInfo.tokenId) {
    return undefined
  }

  if (protocolCase === 'v3ClaimLpFeesRequest') {
    return new ClaimLPFeesRequest({
      claimLPFeesRequest: {
        case: protocolCase,
        value: {
          simulateTransaction: true,
          protocol: getProtocols(positionInfo.version),
          tokenId: Number(positionInfo.tokenId),
          position: new V3Position({
            pool: new V3Pool({
              token0: currency0.isNative ? ZERO_ADDRESS : currency0.address,
              token1: currency1.isNative ? ZERO_ADDRESS : currency1.address,
              fee: positionInfo.feeTier?.feeAmount,
              tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
            }),
            tickLower: positionInfo.tickLower,
            tickUpper: positionInfo.tickUpper,
          }),
          walletAddress: address,
          chainId: currency0.chainId,
          collectAsWETH: !unwrapNativeCurrency,
          expectedTokenOwed0RawAmount: positionInfo.token0UncollectedFees,
          expectedTokenOwed1RawAmount: positionInfo.token1UncollectedFees,
        },
      },
    })
  }

  return new ClaimLPFeesRequest({
    claimLPFeesRequest: {
      case: protocolCase,
      value: {
        simulateTransaction: true,
        protocol: getProtocols(positionInfo.version),
        tokenId: Number(positionInfo.tokenId),
        position: new V4Position({
          pool: new V4Pool({
            token0: currency0.isNative ? ZERO_ADDRESS : currency0.address,
            token1: currency1.isNative ? ZERO_ADDRESS : currency1.address,
            fee: positionInfo.feeTier?.feeAmount,
            tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
            hooks: positionInfo.v4hook,
          }),
          tickLower: positionInfo.tickLower,
          tickUpper: positionInfo.tickUpper,
        }),
        walletAddress: address,
        chainId: currency0.chainId,
      },
    },
  })
}

function UnwrapUnderCard({
  unwrapNativeCurrency,
  setUnwrapNativeCurrency,
  chainId,
}: {
  unwrapNativeCurrency: boolean
  chainId?: UniverseChainId
  setUnwrapNativeCurrency: Dispatch<SetStateAction<boolean>>
}) {
  const nativeCurrency = chainId ? nativeOnChain(chainId) : undefined

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
        <Trans i18nKey="pool.collectAs" values={{ nativeWrappedSymbol: nativeCurrency?.symbol }} />
      </Text>
      <Switch
        id="collect-as-weth"
        checked={unwrapNativeCurrency}
        onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
        variant="default"
      />
    </Flex>
  )
}

export function ClaimFeeModal() {
  const { t } = useTranslation()
  const trace = useTrace()
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()
  const positionInfo = useModalInitialState(ModalName.ClaimFee)
  const account = useWallet().evmAccount
  const [currentTransactionStep, setCurrentTransactionStep] = useState<
    { step: TransactionStep; accepted: boolean } | undefined
  >()
  const [unwrapNativeCurrency, setUnwrapNativeCurrency] = useState(true)

  const { currency0Amount, currency1Amount, chainId } = positionInfo || {}
  const canUnwrap0 = canUnwrapCurrency(currency0Amount?.currency, positionInfo?.version)
  const canUnwrap1 = canUnwrapCurrency(currency1Amount?.currency, positionInfo?.version)
  const canUnwrap = positionInfo && chainId && (canUnwrap0 || canUnwrap1)

  const { closeModal } = useModalState(ModalName.ClaimFee)

  const { fee0Amount, fee1Amount } = positionInfo ?? {}
  const fee0AmountUsd = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const fee1AmountUsd = useUSDCValue(fee1Amount, PollingInterval.Slow)

  const currency0 = getCurrencyWithOptionalUnwrap({
    currency: fee0Amount?.currency,
    shouldUnwrap: unwrapNativeCurrency && canUnwrap0,
  })
  const currency1 = getCurrencyWithOptionalUnwrap({
    currency: fee1Amount?.currency,
    shouldUnwrap: unwrapNativeCurrency && canUnwrap1,
  })
  const currencyInfo0 = useCurrencyInfo(currencyId(currency0))
  const currencyInfo1 = useCurrencyInfo(currencyId(currency1))

  const dispatch = useAppDispatch()

  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const { isSignedInWithPasskey, isSessionAuthenticated, needsPasskeySignin } = useGetPasskeyAuthStatus(
    connectedAccount.connector?.id,
  )

  const claimLpFeesParams = useMemo(() => {
    if (!positionInfo || !currency0 || !currency1) {
      return undefined
    }

    return getClaimLpFeesRequest({
      currency0,
      currency1,
      positionInfo,
      unwrapNativeCurrency,
      address: account?.address,
    })
  }, [account?.address, currency0, currency1, positionInfo, unwrapNativeCurrency])

  const {
    data,
    isLoading: calldataLoading,
    error,
    refetch,
  } = useQuery(
    liquidityQueries.claimFees({
      params: claimLpFeesParams,
      enabled: Boolean(claimLpFeesParams),
    }),
  )

  // prevent logging of the empty error object for now since those are burying signals
  if (error && Object.keys(error).length > 0) {
    const message = parseErrorMessageTitle(error, { defaultTitle: 'unknown ClaimLPFeesCalldataQuery' })
    logger.error(message, {
      tags: {
        file: 'ClaimFeeModal',
        function: 'useEffect',
      },
    })

    sendAnalyticsEvent(InterfaceEventName.CollectLiquidityFailed, {
      message,
    })
  }

  const txInfo = useMemo((): CollectFeesTxAndGasInfo | undefined => {
    const validatedTxRequest = validateTransactionRequest(data?.claim)

    if (!positionInfo || !validatedTxRequest) {
      return undefined
    }

    return {
      type: LiquidityTransactionType.Collect,
      protocolVersion: positionInfo.version,
      action: {
        type: LiquidityTransactionType.Collect,
        currency0Amount: fee0Amount || CurrencyAmount.fromRawAmount(positionInfo.currency0Amount.currency, 0),
        currency1Amount: fee1Amount || CurrencyAmount.fromRawAmount(positionInfo.currency1Amount.currency, 0),
      },
      txRequest: validatedTxRequest,
    }
  }, [data?.claim, fee0Amount, fee1Amount, positionInfo])

  const onPressConfirm = async () => {
    const isValidTx = isValidLiquidityTxContext(txInfo)
    if (!account || !isSignerMnemonicAccountDetails(account) || !isValidTx) {
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
          closeModal()
        },
        onFailure: () => {
          setCurrentTransactionStep(undefined)
        },
        analytics:
          positionInfo && fee0Amount?.currency && fee1Amount?.currency
            ? {
                ...getLPBaseAnalyticsProperties({
                  trace,
                  tickSpacing: positionInfo.tickSpacing,
                  tickLower: positionInfo.tickLower,
                  tickUpper: positionInfo.tickUpper,
                  hook: positionInfo.v4hook,
                  poolId: positionInfo.poolId,
                  currency0: currencyInfo0?.currency ?? fee0Amount.currency,
                  currency1: currencyInfo1?.currency ?? fee1Amount.currency,
                  currency0AmountUsd: fee0AmountUsd,
                  currency1AmountUsd: fee1AmountUsd,
                  version: positionInfo.version,
                }),
              }
            : undefined,
      }),
    )
  }

  return (
    <Modal name={ModalName.ClaimFee} onClose={closeModal} isDismissible>
      <Flex gap="$gap16">
        <GetHelpHeader
          link={uniswapUrls.helpRequestUrl}
          title={t('pool.collectFees')}
          closeModal={closeModal}
          closeDataTestId="ClaimFeeModal-close-icon"
        />
        {fee0Amount && fee1Amount && (
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
              <Flex row alignItems="center" justifyContent="space-between">
                <Flex row gap="$gap8" alignItems="center">
                  <CurrencyLogo currencyInfo={currencyInfo0} size={iconSizes.icon24} />
                  <Text variant="body1" color="neutral1">
                    {currency0?.symbol}
                  </Text>
                </Flex>
                <Flex row gap="$gap8" alignItems="center">
                  <Text variant="body1" color="$neutral1">
                    {formatCurrencyAmount({ value: fee0Amount })}
                  </Text>
                  {fee0AmountUsd && (
                    <Text variant="body1" color="$neutral2">
                      ({convertFiatAmountFormatted(fee0AmountUsd.toExact(), NumberType.FiatTokenPrice)})
                    </Text>
                  )}
                </Flex>
              </Flex>
              <Flex row alignItems="center" justifyContent="space-between">
                <Flex row gap="$gap8" alignItems="center">
                  <CurrencyLogo currencyInfo={currencyInfo1} size={iconSizes.icon24} />
                  <Text variant="body1" color="neutral1">
                    {currency1?.symbol}
                  </Text>
                </Flex>
                <Flex row gap="$gap8" alignItems="center">
                  <Text variant="body1" color="$neutral1">
                    {formatCurrencyAmount({ value: fee1Amount })}
                  </Text>
                  {fee1AmountUsd && (
                    <Text variant="body1" color="$neutral2">
                      ({convertFiatAmountFormatted(fee1AmountUsd.toExact(), NumberType.FiatTokenPrice)})
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Flex>
            {canUnwrap && (
              <UnwrapUnderCard
                unwrapNativeCurrency={unwrapNativeCurrency}
                setUnwrapNativeCurrency={setUnwrapNativeCurrency}
                chainId={chainId}
              />
            )}
          </Flex>
        )}
        <ErrorCallout errorMessage={getErrorMessageToDisplay({ calldataError: error })} onPress={refetch} />
        <Flex row>
          <Button
            data-testid={TestID.ClaimFees}
            key="LoaderButton-animation-ClaimFeeModal-button"
            isDisabled={!data?.claim || Boolean(currentTransactionStep)}
            loading={calldataLoading || Boolean(currentTransactionStep)}
            size="large"
            variant="branded"
            onPress={onPressConfirm}
            icon={needsPasskeySignin ? <Passkey size="$icon.24" /> : undefined}
          >
            {currentTransactionStep
              ? isSignedInWithPasskey
                ? t('swap.button.submitting.passkey')
                : t('common.confirmWallet')
              : isSessionAuthenticated
                ? t('common.confirm')
                : t('common.collect.button')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
