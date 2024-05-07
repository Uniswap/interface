import { useBottomSheetInternal } from '@gorhom/bottom-sheet'
import { useNetInfo } from '@react-native-community/netinfo'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'

import React, { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { ClientDetails, PermitInfo } from 'src/components/WalletConnect/RequestModal/ClientDetails'
import { RequestDetails } from 'src/components/WalletConnect/RequestModal/RequestDetails'
import {
  SignRequest,
  TransactionRequest,
  WalletConnectRequest,
  isTransactionRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { NetworkFee } from 'wallet/src/components/network/NetworkFee'
import { NetworkPill } from 'wallet/src/components/network/NetworkPill'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { EthMethod, isPrimaryTypePermit } from 'wallet/src/features/walletConnect/types'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

const MAX_MODAL_MESSAGE_HEIGHT = 200

const isPotentiallyUnsafe = (request: WalletConnectRequest): boolean =>
  request.type !== EthMethod.PersonalSign

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

  return (
    <>
      <ClientDetails permitInfo={permitInfo} request={request} />
      <Flex gap="$spacing12">
        <Flex
          backgroundColor="$surface2"
          borderBottomColor="$surface2"
          borderBottomWidth={1}
          borderRadius="$rounded16">
          {!permitInfo && (
            <SectionContainer style={requestMessageStyle}>
              <Flex gap="$spacing12">
                <RequestDetails request={request} />
              </Flex>
            </SectionContainer>
          )}
          <Flex px="$spacing16" py="$spacing8">
            {methodCostsGas(request) ? (
              <NetworkFee chainId={chainId} gasFee={gasFee} />
            ) : (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral1" variant="subheading2">
                  {t('walletConnect.request.label.network')}
                </Text>
                <NetworkPill
                  showIcon
                  chainId={chainId}
                  gap="$spacing4"
                  pl="$spacing4"
                  pr="$spacing8"
                  py="$spacing2"
                  textVariant="subheading2"
                />
              </Flex>
            )}
          </Flex>

          <SectionContainer>
            <AccountDetails address={request.account} />
            {!hasSufficientFunds && (
              <Text color="$DEP_accentWarning" pt="$spacing8" variant="body2">
                {t('walletConnect.request.error.insufficientFunds', {
                  currencySymbol: nativeCurrency?.symbol,
                })}
              </Text>
            )}
          </SectionContainer>
        </Flex>

        {!netInfo.isInternetReachable ? (
          <BaseCard.InlineErrorState
            backgroundColor="$DEP_accentWarningSoft"
            icon={
              <AlertTriangle
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

  return (
    <Flex centered row alignSelf="center" gap="$spacing8">
      <AlertTriangle
        color={colors.DEP_accentWarning.val}
        height={iconSizes.icon16}
        width={iconSizes.icon16}
      />
      <Text color="$neutral2" fontStyle="italic" variant="body3">
        {isTransactionRequest(request)
          ? t('walletConnect.request.warning.general.transaction')
          : t('walletConnect.request.warning.general.message')}
      </Text>
    </Flex>
  )
}

const requestMessageStyle: StyleProp<ViewStyle> = {
  // need a fixed height here or else modal gets confused about total height
  maxHeight: MAX_MODAL_MESSAGE_HEIGHT,
  overflow: 'hidden',
}
