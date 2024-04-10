import { useNetInfo } from '@react-native-community/netinfo'
import { getSdkError } from '@walletconnect/utils'
import { providers } from 'ethers'
import React, { PropsWithChildren, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { ClientDetails, PermitInfo } from 'src/components/WalletConnect/RequestModal/ClientDetails'
import { useHasSufficientFunds } from 'src/components/WalletConnect/RequestModal/hooks'
import { RequestDetails } from 'src/components/WalletConnect/RequestModal/RequestDetails'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { wcWeb3Wallet } from 'src/features/walletConnect/saga'
import { selectDidOpenFromDeepLink } from 'src/features/walletConnect/selectors'
import { signWcRequestActions } from 'src/features/walletConnect/signWcRequestSaga'
import { returnToPreviousApp } from 'src/features/walletConnect/WalletConnect'
import {
  isTransactionRequest,
  SignRequest,
  TransactionRequest,
  WalletConnectRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { AccountDetails } from 'wallet/src/components/accounts/AccountDetails'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { NetworkFee } from 'wallet/src/components/network/NetworkFee'
import { NetworkPill } from 'wallet/src/components/network/NetworkPill'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasSpeed } from 'wallet/src/features/gas/types'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { useIsBlocked, useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import {
  EthMethod,
  isPrimaryTypePermit,
  WCEventType,
  WCRequestOutcome,
} from 'wallet/src/features/walletConnect/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

const MAX_MODAL_MESSAGE_HEIGHT = 200

interface Props {
  onClose: () => void
  request: SignRequest | TransactionRequest
}

const isPotentiallyUnsafe = (request: WalletConnectRequest): boolean =>
  request.type !== EthMethod.PersonalSign

const methodCostsGas = (request: WalletConnectRequest): request is TransactionRequest =>
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
    logger.error(error, { tags: { file: 'WalletConnectRequestModal', function: 'getPermitInfo' } })
    return undefined
  }
}

const VALID_REQUEST_TYPES = [
  EthMethod.PersonalSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.EthSign,
  EthMethod.EthSendTransaction,
]

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

export function WalletConnectRequestModal({ onClose, request }: Props): JSX.Element | null {
  const colors = useSporeColors()
  const netInfo = useNetInfo()
  const didOpenFromDeepLink = useAppSelector(selectDidOpenFromDeepLink)
  const chainId = request.chainId

  const tx: providers.TransactionRequest | null = useMemo(() => {
    if (!isTransactionRequest(request)) {
      return null
    }

    return { ...request.transaction, chainId }
  }, [chainId, request])

  const signerAccounts = useSignerAccounts()
  const signerAccount = signerAccounts.find((account) =>
    areAddressesEqual(account.address, request.account)
  )
  const gasFee = useTransactionGasFee(tx, GasSpeed.Urgent)
  const hasSufficientFunds = useHasSufficientFunds({
    account: request.account,
    chainId,
    gasFee,
    value: isTransactionRequest(request) ? request.transaction.value : undefined,
  })

  const { isBlocked: isSenderBlocked, isBlockedLoading: isSenderBlockedLoading } =
    useIsBlockedActiveAddress()

  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } =
    useIsBlocked(tx?.to)

  const isBlocked = isSenderBlocked ?? isRecipientBlocked
  const isBlockedLoading = isSenderBlockedLoading || isRecipientBlockedLoading

  const checkConfirmEnabled = (): boolean => {
    if (!netInfo.isInternetReachable) {
      return false
    }

    if (!signerAccount) {
      return false
    }

    if (isBlocked || isBlockedLoading) {
      return false
    }

    if (methodCostsGas(request)) {
      return !!(tx && hasSufficientFunds && gasFee.value)
    }

    if (isTransactionRequest(request)) {
      return !!tx
    }

    return true
  }

  const confirmEnabled = checkConfirmEnabled()

  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  /**
   * TODO: [MOB-239] implement this behavior in a less janky way. Ideally if we can distinguish between `onClose` being called programmatically and `onClose` as a results of a user dismissing the modal then we can determine what this value should be without this class variable.
   * Indicates that the modal can reject the request when the modal happens. This will be false when the modal closes as a result of the user explicitly confirming or rejecting a request and true otherwise.
   */
  const rejectOnCloseRef = useRef(true)

  const onReject = async (): Promise<void> => {
    if (request.dapp.source === 'walletconnect') {
      await wcWeb3Wallet.respondSessionRequest({
        topic: request.sessionId,
        response: {
          id: Number(request.internalId),
          jsonrpc: '2.0',
          error: getSdkError('USER_REJECTED'),
        },
      })
    }

    rejectOnCloseRef.current = false

    sendMobileAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
      request_type: isTransactionRequest(request)
        ? WCEventType.TransactionRequest
        : WCEventType.SignRequest,
      eth_method: request.type,
      dapp_url: request.dapp.url,
      dapp_name: request.dapp.name,
      wc_version: '2',
      chain_id: chainId,
      outcome: WCRequestOutcome.Reject,
    })

    onClose()
    if (didOpenFromDeepLink) {
      returnToPreviousApp()
    }
  }

  const onConfirm = async (): Promise<void> => {
    if (!confirmEnabled || !signerAccount) {
      return
    }
    if (request.type === EthMethod.EthSendTransaction) {
      if (!gasFee.params) {
        return
      } // appeasing typescript
      dispatch(
        signWcRequestActions.trigger({
          sessionId: request.sessionId,
          requestInternalId: request.internalId,
          method: request.type,
          transaction: { ...tx, ...gasFee.params },
          account: signerAccount,
          dapp: request.dapp,
          chainId,
        })
      )
    } else {
      dispatch(
        signWcRequestActions.trigger({
          sessionId: request.sessionId,
          requestInternalId: request.internalId,
          // this is EthSignMessage type
          method: request.type,
          message: request.message || request.rawMessage,
          account: signerAccount,
          dapp: request.dapp,
          chainId,
        })
      )
    }

    rejectOnCloseRef.current = false

    sendMobileAnalyticsEvent(MobileEventName.WalletConnectSheetCompleted, {
      request_type: isTransactionRequest(request)
        ? WCEventType.TransactionRequest
        : WCEventType.SignRequest,
      eth_method: request.type,
      dapp_url: request.dapp.url,
      dapp_name: request.dapp.name,
      wc_version: '2',
      chain_id: chainId,
      outcome: WCRequestOutcome.Confirm,
    })

    onClose()
    if (didOpenFromDeepLink) {
      returnToPreviousApp()
    }
  }

  const { trigger: actionButtonTrigger } = useBiometricPrompt(onConfirm)
  const { requiredForTransactions } = useBiometricAppSettings()

  if (!VALID_REQUEST_TYPES.includes(request.type)) {
    return null
  }

  const handleClose = async (): Promise<void> => {
    if (rejectOnCloseRef.current) {
      await onReject()
    } else {
      onClose()
    }
  }

  const nativeCurrency = chainId && NativeCurrency.onChain(chainId)
  const permitInfo = getPermitInfo(request)

  return (
    <>
      <BottomSheetModal name={ModalName.WCSignRequest} onClose={handleClose}>
        <Flex gap="$spacing24" pb="$spacing12" pt="$spacing36" px="$spacing16">
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
            <Flex row gap="$spacing12">
              <Button
                fill
                size="medium"
                testID={ElementName.Cancel}
                theme="tertiary"
                onPress={onReject}>
                {t('common.button.cancel')}
              </Button>
              <Button
                fill
                disabled={!confirmEnabled}
                size="medium"
                testID={ElementName.Confirm}
                onPress={async (): Promise<void> => {
                  if (requiredForTransactions) {
                    await actionButtonTrigger()
                  } else {
                    await onConfirm()
                  }
                }}>
                {isTransactionRequest(request)
                  ? t('common.button.accept')
                  : t('walletConnect.request.button.sign')}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </BottomSheetModal>
    </>
  )
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
