import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useNetInfo } from '@react-native-community/netinfo'
import { useTranslation } from 'react-i18next'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ClientDetails, PermitInfo } from 'src/components/Requests/RequestModal/ClientDetails'
import { RequestDetails, SectionContainer } from 'src/components/Requests/RequestModal/RequestDetails'
import {
  SignRequest,
  TransactionRequest,
  WalletConnectSigningRequest,
  WalletSendCallsEncodedRequest,
  isTransactionRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangleFilled from 'ui/src/assets/icons/alert-triangle-filled.svg'
import { iconSizes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { isPrimaryTypePermit } from 'uniswap/src/types/walletConnect'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'

const isPotentiallyUnsafe = (request: WalletConnectSigningRequest): boolean => request.type !== EthMethod.PersonalSign

export const getDoesMethodCostGas = (request: WalletConnectSigningRequest): boolean =>
  request.type === EthMethod.EthSendTransaction || request.type === EthMethod.SendCalls

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
  request: SignRequest | TransactionRequest | WalletSendCallsEncodedRequest
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
  const colors = useSporeColors()
  const { animatedFooterHeight } = useBottomSheetInternal()

  const netInfo = useNetInfo()

  const bottomSpacerStyle = useAnimatedStyle(() => ({
    height: animatedFooterHeight.value,
  }))

  const hasGasFee = getDoesMethodCostGas(request)

  return (
    <>
      <ClientDetails permitInfo={permitInfo} request={request} />
      <Flex pt="$spacing8">
        <RequestDetails request={request} permitInfo={permitInfo} />
        <Flex gap="$spacing8" mb="$spacing12" pt="$spacing20" px="$spacing4">
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
          <SectionContainer>
            <Text color="$statusWarning" variant="body2">
              {t('walletConnect.request.error.insufficientFunds', {
                currencySymbol: nativeCurrency?.symbol,
              })}
            </Text>
          </SectionContainer>
        )}

        {!netInfo.isInternetReachable ? (
          <BaseCard.InlineErrorState
            backgroundColor="$statusWarning2"
            icon={
              <AlertTriangleFilled
                color={colors.statusWarning.val}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            }
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
  const colors = useSporeColors()
  const { t } = useTranslation()

  if (!showUnsafeWarning && !isBlockedAddress) {
    return null
  }

  if (isBlockedAddress) {
    return <BlockedAddressWarning centered row alignSelf="center" />
  }

  if (!isTransactionRequest(request)) {
    return (
      <Flex centered row alignSelf="center" gap="$spacing8">
        <AlertTriangleFilled color={colors.statusWarning.val} height={iconSizes.icon16} width={iconSizes.icon16} />
        <Text color="$neutral2" fontStyle="italic" variant="body3">
          {t('walletConnect.request.warning.general.message')}
        </Text>
      </Flex>
    )
  }

  return null
}
