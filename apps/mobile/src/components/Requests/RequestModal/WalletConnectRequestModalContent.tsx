import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useNetInfo } from '@react-native-community/netinfo'
import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ClientDetails, PermitInfo } from 'src/components/Requests/RequestModal/ClientDetails'
import { RequestDetails } from 'src/components/Requests/RequestModal/RequestDetails'
import {
  SignRequest,
  TransactionRequest,
  WalletConnectRequest,
  isTransactionRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangleFilled from 'ui/src/assets/icons/alert-triangle-filled.svg'
import { iconSizes } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { EthMethod, isPrimaryTypePermit } from 'uniswap/src/types/walletConnect'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { AddressFooter } from 'wallet/src/features/transactions/TransactionRequest/AddressFooter'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'

const MAX_MODAL_MESSAGE_HEIGHT = 200

const isPotentiallyUnsafe = (request: WalletConnectRequest): boolean => request.type !== EthMethod.PersonalSign

export const methodCostsGas = (request: WalletConnectRequest): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction

/** If the request is a permit then parse the relevant information otherwise return undefined. */
const getPermitInfo = (request: WalletConnectRequest): PermitInfo | undefined => {
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
  request: SignRequest | TransactionRequest
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

  const hasGasFee = methodCostsGas(request)

  return (
    <>
      <ClientDetails permitInfo={permitInfo} request={request} />
      <Flex pt="$spacing8">
        <Flex backgroundColor="$surface2" borderColor="$surface3" borderRadius="$rounded16" borderWidth="$spacing1">
          {!permitInfo && (
            <SectionContainer style={requestMessageStyle}>
              <RequestDetails request={request} />
            </SectionContainer>
          )}
        </Flex>
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
          />
          <AddressFooter activeAccountAddress={request.account} px="$spacing8" />
        </Flex>

        {!hasSufficientFunds && (
          <SectionContainer>
            <Text color="$DEP_accentWarning" variant="body2">
              {t('walletConnect.request.error.insufficientFunds', {
                currencySymbol: nativeCurrency?.symbol,
              })}
            </Text>
          </SectionContainer>
        )}

        {!netInfo.isInternetReachable ? (
          <BaseCard.InlineErrorState
            backgroundColor="$DEP_accentWarningSoft"
            icon={
              <AlertTriangleFilled
                color={colors.DEP_accentWarning.val}
                height={iconSizes.icon16}
                width={iconSizes.icon16}
              />
            }
            textColor="$DEP_accentWarning"
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

function SectionContainer({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>): JSX.Element | null {
  return children ? (
    <Flex p="$spacing16" style={style}>
      {children}
    </Flex>
  ) : null
}

function WarningSection({
  request,
  showUnsafeWarning,
  isBlockedAddress,
}: {
  request: WalletConnectRequest
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
        <AlertTriangleFilled color={colors.DEP_accentWarning.val} height={iconSizes.icon16} width={iconSizes.icon16} />
        <Text color="$neutral2" fontStyle="italic" variant="body3">
          {t('walletConnect.request.warning.general.message')}
        </Text>
      </Flex>
    )
  }

  return null
}

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}
