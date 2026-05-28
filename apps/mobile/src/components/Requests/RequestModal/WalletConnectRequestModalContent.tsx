import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useNetInfo } from '@react-native-community/netinfo'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ClientDetails, PermitInfo } from 'src/components/Requests/RequestModal/ClientDetails'
import { RequestDetails } from 'src/components/Requests/RequestModal/RequestDetails'
import {
  WalletConnectSigningRequest,
  isBatchedTransactionRequest,
  isTransactionRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { isPrimaryTypePermit } from 'uniswap/src/types/walletConnect'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { MAX_HIDDEN_CALLS_BY_DEFAULT } from 'wallet/src/components/BatchedTransactions/BatchedTransactionDetails'
import { WarningBox } from 'wallet/src/components/WarningBox/WarningBox'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'

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
  isBlocked: boolean
}

export function WalletConnectRequestModalContent({
  request,
  hasSufficientFunds,
  isBlocked,
  gasFee,
}: WalletConnectRequestModalContentProps): JSX.Element {
  const chainId = request.chainId
  const permitInfo = getPermitInfo(request)
  const nativeCurrency = chainId && NativeCurrency.onChain(chainId)

  const { t } = useTranslation()
  const { animatedFooterHeight } = useBottomSheetInternal()

  const netInfo = useNetInfo()

  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  const hasGasFee = getDoesMethodCostGas(request)

  // If link mode is supported, we can sign messages through universal links on device
  const suppressOfflineWarning = request.isLinkModeSupported

  return (
    <>
      <Flex px="$spacing24">
        <ClientDetails permitInfo={permitInfo} request={request} />
      </Flex>
      <RequestDetails request={request} permitInfo={permitInfo} />
      <Flex px="$spacing24">
        <Flex gap="$spacing12" mb="$spacing12" px="$spacing4" pt="$spacing16">
          <NetworkFeeFooter
            chainId={chainId}
            gasFee={
              hasGasFee
                ? gasFee
                : // Mock gas fee for non-transaction requests
                  {
                    value: '0',
                    isLoading: false,
                    error: null,
                  }
            }
            showNetworkLogo={hasGasFee}
            requestMethod={request.type}
          />
          <AddressFooter activeAccountAddress={request.account} px="$spacing8" />
        </Flex>

        {!hasSufficientFunds && (
          <Flex p="$spacing16">
            <Text color="$statusWarning" variant="body2">
              {t('walletConnect.request.error.insufficientFunds', {
                currencySymbol: nativeCurrency?.symbol,
              })}
            </Text>
          </Flex>
        )}

        {!netInfo.isInternetReachable && !suppressOfflineWarning ? (
          <BaseCard.InlineErrorState
            backgroundColor="$statusWarning2"
            icon={<AlertTriangleFilled color="$statusWarning" size="$icon.16" />}
            textColor="$statusWarning"
            title={t('walletConnect.request.error.network')}
          />
        ) : (
          <WarningSection
            isBlockedAddress={isBlocked}
            request={request}
            showUnsafeWarning={isPotentiallyUnsafe(request)}
          />
        )}
      </Flex>
      <Animated.View style={bottomSpacerStyle} />
    </>
  )
}

function WarningSection({
  request,
  showUnsafeWarning,
  isBlockedAddress,
}: {
  request: WalletConnectSigningRequest
  showUnsafeWarning: boolean
  isBlockedAddress: boolean
}): JSX.Element | null {
  const { t } = useTranslation()

  if (!showUnsafeWarning && !isBlockedAddress) {
    return null
  }

  if (isBlockedAddress) {
    return <BlockedAddressWarning centered row alignSelf="center" />
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
