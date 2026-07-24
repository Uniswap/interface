import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useNetInfo } from '@react-native-community/netinfo'
import { GasFeeResult } from '@universe/api'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ClientDetails, PermitInfo } from 'src/components/Requests/RequestModal/ClientDetails'
import {
  isBatchedTransactionRequest,
  isTransactionRequest,
  isUserOpRequest,
  WalletConnectSigningRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { hasGasEstimationFailed } from 'uniswap/src/features/gas/utils'
import { isPrimaryTypePermit, UwULinkMethod } from 'uniswap/src/types/walletConnect'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { MAX_HIDDEN_CALLS_BY_DEFAULT } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'
import { DappPersonalSignContent } from 'wallet/src/components/dappRequests/DappPersonalSignContent'
import { DappSendCallsScanningContent } from 'wallet/src/components/dappRequests/DappSendCallsScanningContent'
import { DappSignTypedDataContent } from 'wallet/src/components/dappRequests/DappSignTypedDataContent'
import { DappTransactionScanningContent } from 'wallet/src/components/dappRequests/DappTransactionScanningContent'
import { WarningBox } from 'wallet/src/components/WarningBox/WarningBox'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'

const isPotentiallyUnsafe = (request: WalletConnectSigningRequest): boolean => request.type !== EthMethod.PersonalSign

export const getDoesMethodCostGas = (request: WalletConnectSigningRequest): boolean =>
  request.type === EthMethod.EthSendTransaction || request.type === EthMethod.WalletSendCalls

/** If the request is a permit then parse the relevant information otherwise return undefined. */
const getPermitInfo = (request: WalletConnectSigningRequest): PermitInfo | undefined => {
  if (request.type !== EthMethod.SignTypedDataV4) {
    return undefined
  }

  try {
    const message = JSON.parse(request.rawMessage)
    if (!isPrimaryTypePermit(message)) {
      return undefined
    }

    const { domain, message: permitPayload } = message
    const currencyId = buildCurrencyId(domain.chainId, domain.verifyingContract)
    const amount = permitPayload.value

    return { currencyId, amount }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'WalletConnectRequestModal', function: 'getPermitInfo' },
    })
    return undefined
  }
}

type WalletConnectRequestModalContentProps = {
  gasFee: GasFeeResult
  hasSufficientFunds: boolean
  request: WalletConnectSigningRequest
  showSmartWalletActivation?: boolean
  confirmedRisk: boolean
  gasOverrides?: GasFeeOverrides
  onConfirmRisk: (confirmed: boolean) => void
  onChangeGasOverrides?: (overrides: GasFeeOverrides | undefined) => void
  onRiskLevelChange: (riskLevel: TransactionRiskLevel) => void
}

export function WalletConnectRequestModalContent({
  request,
  hasSufficientFunds,
  gasFee,
  showSmartWalletActivation,
  confirmedRisk,
  gasOverrides,
  onConfirmRisk,
  onChangeGasOverrides,
  onRiskLevelChange,
}: WalletConnectRequestModalContentProps): JSX.Element {
  const chainId = request.chainId
  const permitInfo = getPermitInfo(request)
  const nativeCurrency = getChainInfo(chainId).nativeCurrency

  const { animatedLayoutState } = useBottomSheetInternal()

  const netInfo = useNetInfo()

  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedLayoutState.value.footerHeight,
  }))

  // If link mode is supported, we can sign messages through universal links on device
  const suppressOfflineWarning = request.isLinkModeSupported

  return (
    <>
      <Flex px="$spacing24" mb="$spacing24">
        <ClientDetails permitInfo={permitInfo} request={request} />
      </Flex>

      <Flex px="$spacing16">
        <ScanningContent
          request={request}
          chainId={chainId}
          gasFee={gasFee}
          showSmartWalletActivation={showSmartWalletActivation}
          confirmedRisk={confirmedRisk}
          gasOverrides={gasOverrides}
          onConfirmRisk={onConfirmRisk}
          onChangeGasOverrides={onChangeGasOverrides}
          onRiskLevelChange={onRiskLevelChange}
        />

        <RequestWarnings
          request={request}
          hasSufficientFunds={hasSufficientFunds}
          isNetworkReachable={Boolean(netInfo.isInternetReachable)}
          suppressOfflineWarning={Boolean(suppressOfflineWarning)}
          nativeCurrencySymbol={nativeCurrency.symbol}
          gasFee={gasFee}
        />
      </Flex>
      <Animated.View style={bottomSpacerStyle} />
    </>
  )
}

function RequestWarnings({
  request,
  hasSufficientFunds,
  isNetworkReachable,
  suppressOfflineWarning,
  nativeCurrencySymbol,
  gasFee,
}: {
  request: WalletConnectSigningRequest
  hasSufficientFunds: boolean
  isNetworkReachable: boolean
  suppressOfflineWarning: boolean
  nativeCurrencySymbol: string
  gasFee: GasFeeResult
}): JSX.Element {
  const { t } = useTranslation()

  // Check if gas estimation failed (has error or no value after loading)
  const isTransactionRequestType = getDoesMethodCostGas(request)
  const gasEstimationFailed = hasGasEstimationFailed(isTransactionRequestType, gasFee)

  return (
    <>
      {gasEstimationFailed && (
        <Flex p="$spacing16">
          <Text color="$statusCritical" variant="body2">
            {t('dapp.request.error.gasEstimation')}
          </Text>
        </Flex>
      )}

      {!hasSufficientFunds && !gasEstimationFailed && (
        <Flex p="$spacing16">
          <Text color="$statusWarning" variant="body2">
            {t('walletConnect.request.error.insufficientFunds', {
              currencySymbol: nativeCurrencySymbol,
            })}
          </Text>
        </Flex>
      )}

      {!isNetworkReachable && !suppressOfflineWarning ? (
        <BaseCard.InlineErrorState
          backgroundColor="$statusWarning2"
          icon={<AlertTriangleFilled color="$statusWarning" size="$icon.16" />}
          textColor="$statusWarning"
          title={t('walletConnect.request.error.network')}
        />
      ) : (
        <WarningSection request={request} showUnsafeWarning={isPotentiallyUnsafe(request)} />
      )}
    </>
  )
}

function WarningSection({
  request,
  showUnsafeWarning,
}: {
  request: WalletConnectSigningRequest
  showUnsafeWarning: boolean
}): JSX.Element | null {
  const { t } = useTranslation()

  if (!showUnsafeWarning) {
    return null
  }

  if (isBatchedTransactionRequest(request)) {
    if (request.calls.length <= 1) {
      return null
    }
    const level = request.calls.length >= MAX_HIDDEN_CALLS_BY_DEFAULT ? 'critical' : 'warning'
    return <WarningBox level={level} message={t('walletConnect.request.warning.batch.message')} />
  }

  // TODO: Refactor to explicitly warn users only about signing requests instead of all non-transaction requests
  if (!isTransactionRequest(request)) {
    return <WarningBox level="critical" message={t('walletConnect.request.warning.general.message')} />
  }

  return null
}

/** Helper component to render appropriate scanning content based on request type */
// oxlint-disable-next-line typescript/consistent-return -- biome-parity: oxlint is stricter here
function ScanningContent({
  request,
  chainId,
  gasFee,
  showSmartWalletActivation,
  confirmedRisk,
  gasOverrides,
  onConfirmRisk,
  onChangeGasOverrides,
  onRiskLevelChange,
}: {
  request: WalletConnectSigningRequest
  chainId: number
  gasFee: GasFeeResult
  showSmartWalletActivation?: boolean
  confirmedRisk: boolean
  gasOverrides?: GasFeeOverrides
  onConfirmRisk: (confirmed: boolean) => void
  onChangeGasOverrides?: (overrides: GasFeeOverrides | undefined) => void
  onRiskLevelChange: (riskLevel: TransactionRiskLevel) => void
}): JSX.Element {
  switch (request.type) {
    case EthMethod.EthSendTransaction:
      return (
        <DappTransactionScanningContent
          transaction={request.transaction}
          chainId={chainId}
          account={request.account}
          dappUrl={request.dappRequestInfo.url}
          gasFee={gasFee}
          requestMethod={request.type}
          showSmartWalletActivation={showSmartWalletActivation}
          confirmedRisk={confirmedRisk}
          gasOverrides={gasOverrides}
          onConfirmRisk={onConfirmRisk}
          onChangeGasOverrides={onChangeGasOverrides}
          onRiskLevelChange={onRiskLevelChange}
        />
      )

    case UwULinkMethod.Erc20Send:
      // WalletConnectRequestModal short-circuits this request type and renders
      // UwULinkErc20SendModal before WalletConnectRequestModalContent is mounted,
      // so this branch is unreachable. If we hit it, the parent dispatcher is broken.
      throw new Error(
        'UwULinkMethod.Erc20Send must be handled by UwULinkErc20SendModal, not WalletConnectRequestModalContent',
      )

    case EthMethod.PersonalSign:
    case EthMethod.EthSign:
      return (
        <DappPersonalSignContent
          chainId={chainId}
          account={request.account}
          message={request.message || request.rawMessage}
          method={request.type}
          params={
            request.type === EthMethod.PersonalSign
              ? [request.rawMessage, request.account]
              : [request.account, request.rawMessage]
          }
          dappUrl={request.dappRequestInfo.url}
          confirmedRisk={confirmedRisk}
          onConfirmRisk={onConfirmRisk}
          onRiskLevelChange={onRiskLevelChange}
        />
      )

    case EthMethod.WalletSendCalls:
      return (
        <DappSendCallsScanningContent
          calls={request.calls}
          chainId={chainId}
          account={request.account}
          dappUrl={request.dappRequestInfo.url}
          gasFee={gasFee}
          requestMethod={request.type}
          showSmartWalletActivation={showSmartWalletActivation}
          confirmedRisk={confirmedRisk}
          tx={isBatchedTransactionRequest(request) ? { ...request.encodedTransaction, chainId } : undefined}
          gasOverrides={gasOverrides}
          sponsorMetadata={isUserOpRequest(request) && request.gasSponsored ? request.sponsorMetadata : undefined}
          onConfirmRisk={onConfirmRisk}
          onChangeGasOverrides={onChangeGasOverrides}
          onRiskLevelChange={onRiskLevelChange}
        />
      )

    case EthMethod.SignTypedData:
    case EthMethod.SignTypedDataV4:
      return (
        <DappSignTypedDataContent
          chainId={chainId}
          account={request.account}
          method={request.type}
          params={
            request.type === EthMethod.SignTypedDataV4
              ? [request.account, request.rawMessage]
              : [request.rawMessage, request.account]
          }
          dappUrl={request.dappRequestInfo.url}
          confirmedRisk={confirmedRisk}
          typedData={request.rawMessage}
          onConfirmRisk={onConfirmRisk}
          onRiskLevelChange={onRiskLevelChange}
        />
      )
  }
}
