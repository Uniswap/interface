import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { ErrorCallout } from 'components/ErrorCallout'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { canUnwrapCurrency, getCurrencyWithOptionalUnwrap } from 'components/Liquidity/utils/currency'
import { getProtocolItems } from 'components/Liquidity/utils/protocolVersion'
import { useAccount } from 'hooks/useAccount'
import { useModalInitialState } from 'hooks/useModalInitialState'
import { useModalState } from 'hooks/useModalState'
import useSelectChain from 'hooks/useSelectChain'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAppDispatch } from 'state/hooks'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Switch, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { PollingInterval, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useClaimLpFeesCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useClaimLpFeesCalldataQuery'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
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

  const { fee0Amount, fee1Amount, token0UncollectedFees, token1UncollectedFees } = positionInfo ?? {}
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

    return {
      simulateTransaction: true,
      protocol: getProtocolItems(positionInfo.version),
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account?.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      position: {
        pool: {
          token0: currency0.isNative ? ZERO_ADDRESS : currency0.address,
          token1: currency1.isNative ? ZERO_ADDRESS : currency1.address,
          fee: positionInfo.feeTier?.feeAmount,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
        tickLower: positionInfo.tickLower !== undefined ? positionInfo.tickLower : undefined,
        tickUpper: positionInfo.tickUpper !== undefined ? positionInfo.tickUpper : undefined,
      },
      expectedTokenOwed0RawAmount: positionInfo.version !== ProtocolVersion.V4 ? token0UncollectedFees : undefined,
      expectedTokenOwed1RawAmount: positionInfo.version !== ProtocolVersion.V4 ? token1UncollectedFees : undefined,
      collectAsWETH: positionInfo.version !== ProtocolVersion.V4 ? !unwrapNativeCurrency : undefined,
    } satisfies TradingApi.ClaimLPFeesRequest
  }, [
    account?.address,
    currency0,
    currency1,
    positionInfo,
    token0UncollectedFees,
    token1UncollectedFees,
    unwrapNativeCurrency,
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
