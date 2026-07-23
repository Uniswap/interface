import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ClaimFeesRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Switch, Text } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import {
  type CollectFeesTxAndGasInfo,
  isValidLiquidityTxContext,
  LiquidityTransactionType,
} from 'uniswap/src/features/transactions/liquidity/types'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import type { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ErrorCallout } from '~/components/ErrorCallout'
import { getLPBaseAnalyticsProperties } from '~/features/Liquidity/analytics'
import { canUnwrapCurrency, getCurrencyWithOptionalUnwrap } from '~/features/Liquidity/utils/currency'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'
import { useAccount } from '~/hooks/useAccount'
import { useModalInitialState } from '~/hooks/useModalInitialState'
import { useModalState } from '~/hooks/useModalState'
import { useSelectChain } from '~/hooks/useSelectChain'
import { useAppDispatch } from '~/state/hooks'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'

function getClaimLpFeesRequest({
  currency0,
  positionInfo,
  unwrapNativeCurrency,
  address,
}: {
  currency0: Currency
  positionInfo: PositionInfo
  unwrapNativeCurrency: boolean
  address: string | undefined
}): ClaimFeesRequest | undefined {
  if (!address || !positionInfo.tokenId) {
    return undefined
  }

  return new ClaimFeesRequest({
    walletAddress: address,
    chainId: currency0.chainId,
    tokenId: positionInfo.tokenId,
    simulateTransaction: true,
    collectAsWeth: positionInfo.version !== ProtocolVersion.V4 ? !unwrapNativeCurrency : undefined,
    protocol: getProtocols(positionInfo.version),
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
  const { t } = useTranslation()
  const nativeCurrency = chainId ? nativeOnChain(chainId) : undefined

  return (
    <Flex
      row
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      justifyContent="space-between"
      alignItems="center"
      py="$padding12"
      px="$padding16"
    >
      <Text variant="body2" color="$neutral2">
        {t('pool.collectAs', { nativeWrappedSymbol: nativeCurrency?.symbol ?? t('common.token') })}
      </Text>
      <Switch
        id="collect-as-weth"
        checked={unwrapNativeCurrency}
        // oxlint-disable-next-line no-shadow
        onCheckedChange={() => setUnwrapNativeCurrency((unwrapNativeCurrency) => !unwrapNativeCurrency)}
        variant="default"
      />
    </Flex>
  )
}

function FeeTokenRow({
  currencyInfo,
  symbol,
  formattedAmount,
  fiatAmount,
}: {
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  symbol?: string
  formattedAmount: string
  fiatAmount?: string
}) {
  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$gap16">
      <Flex gap="$gap4" fill>
        <Text variant="heading3" color="$neutral1">
          {formattedAmount} {symbol}
        </Text>
        {fiatAmount && (
          <Text variant="body2" color="$neutral2">
            {fiatAmount}
          </Text>
        )}
      </Flex>
      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon36} />
    </Flex>
  )
}

// oxlint-disable-next-line complexity
export function ClaimFeeModal() {
  const { t } = useTranslation()
  const trace = useTrace()
  const isCentralizedPricesEnabled = useFeatureFlag(FeatureFlags.CentralizedPrices)
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

  const claimFeesQueryParams = useMemo((): ClaimFeesRequest | undefined => {
    if (!positionInfo || !currency0) {
      return undefined
    }

    return getClaimLpFeesRequest({
      currency0,
      positionInfo,
      unwrapNativeCurrency,
      address: account?.address,
    })
  }, [account?.address, currency0, positionInfo, unwrapNativeCurrency])

  const {
    data,
    isLoading: calldataLoading,
    error,
    refetch,
  } = useQuery(
    liquidityQueries.claimFees({
      params: claimFeesQueryParams,
      enabled: Boolean(claimFeesQueryParams),
    }),
  )

  // prevent logging of the empty error object for now since those are burying signals
  if (error && Object.keys(error).length > 0) {
    const message = parseErrorMessageTitle(error, {
      defaultTitle: 'unknown ClaimLPFeesCalldataQuery',
    })
    logger.error(message, {
      tags: {
        file: 'ClaimFeeModal',
        function: 'useEffect',
      },
    })

    sendAnalyticsEvent(InterfaceEventName.CollectLiquidityFailed, {
      message,
      // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
      ...claimFeesQueryParams,
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
                  isCentralizedPricesEnabled,
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
          link={UniswapHelpUrls.requestUrl}
          title={t('pool.collectFees')}
          closeModal={closeModal}
          closeDataTestId="ClaimFeeModal-close-icon"
        />
        {fee0Amount && fee1Amount && (
          <Flex gap="$gap16">
            <Flex gap="$gap12">
              <FeeTokenRow
                currencyInfo={currencyInfo0}
                symbol={currency0?.symbol}
                formattedAmount={formatCurrencyAmount({ value: fee0Amount })}
                fiatAmount={
                  fee0AmountUsd
                    ? convertFiatAmountFormatted(fee0AmountUsd.toExact(), NumberType.FiatTokenPrice)
                    : undefined
                }
              />
              <Text variant="heading3" color="$neutral3">
                +
              </Text>
              <FeeTokenRow
                currencyInfo={currencyInfo1}
                symbol={currency1?.symbol}
                formattedAmount={formatCurrencyAmount({ value: fee1Amount })}
                fiatAmount={
                  fee1AmountUsd
                    ? convertFiatAmountFormatted(fee1AmountUsd.toExact(), NumberType.FiatTokenPrice)
                    : undefined
                }
              />
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
            icon={needsPasskeySignin ? <Passkey size="$icon.24" color="$white" /> : undefined}
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

export default ClaimFeeModal
