import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useActiveAddress, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsPermissionedSendBlocked } from 'uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked'
import { chainIdToPlatform, isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useRecentTransfersByAddress } from 'uniswap/src/features/send/useRecentTransfersByAddress'
import { ElementName, InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useDismissedCompatibleAddressWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { CompatibleAddressModal } from 'uniswap/src/features/transactions/modals/CompatibleAddressModal'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useSendCallback } from '~/features/Swap/hooks/useSendCallback'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useAccount } from '~/hooks/useAccount'
import { useModalState } from '~/hooks/useModalState'
import { NewAddressSpeedBumpModal } from '~/pages/Swap/Send/NewAddressSpeedBump'
import { SelfSendSpeedBumpModal } from '~/pages/Swap/Send/SelfSendSpeedBump'
import { SendCurrencyInputForm } from '~/pages/Swap/Send/SendCurrencyInputForm'
import { SendRecipientForm } from '~/pages/Swap/Send/SendRecipientForm'
import { SendReviewModalInner } from '~/pages/Swap/Send/SendReviewModal'
import { SmartContractSpeedBumpModal } from '~/pages/Swap/Send/SmartContractSpeedBump'
import { useSendContext } from '~/pages/Swap/Send/state/SendContext'
import { UserRejectedRequestError } from '~/utils/errors'

export type SendFormProps = {
  onCurrencyChange?: (selected: CurrencyState) => void
  disableTokenInputs?: boolean
}

function useSendButtonState() {
  const { sendState, derivedSendInfo } = useSendContext()
  const { recipient, inputCurrency, exactAmountFiat, exactAmountToken, inputInFiat } = sendState
  const { parsedTokenAmount, recipientData } = derivedSendInfo
  const { t } = useTranslation()

  const isSolanaToken = inputCurrency?.chainId && isSVMChain(inputCurrency.chainId)

  return useMemo(() => {
    if (isSolanaToken) {
      return {
        label: t('send.solanaSendNotSupported'),
        disabled: true,
      }
    }

    if (recipient && !recipientData) {
      return {
        label: t('common.invalidRecipient.error'),
        disabled: true,
      }
    }

    if (!parsedTokenAmount) {
      const exactAmount = inputInFiat ? exactAmountFiat : exactAmountToken

      if (exactAmount && parseFloat(exactAmount) > 0) {
        return {
          label: t('swap.warning.enterLargerAmount.title'),
          disabled: true,
        }
      }

      return {
        label: t('common.noAmount.error'),
        disabled: true,
      }
    }

    if (!recipient && !recipientData) {
      return {
        label: t('common.input.noRecipient.error'),
        disabled: true,
      }
    }

    return {
      label: t('common.send.button'),
      disabled: false,
    }
  }, [recipient, recipientData, parsedTokenAmount, inputInFiat, exactAmountFiat, exactAmountToken, t, isSolanaToken])
}

enum SendFormModalState {
  None = 'None',
  SELF_SEND_SPEED_BUMP = 'SELF_SEND_SPEED_BUMP',
  SMART_CONTRACT_SPEED_BUMP = 'SMART_CONTRACT_SPEED_BUMP',
  NEW_ADDRESS_SPEED_BUMP = 'NEW_ADDRESS_SPEED_BUMP',
  COMPATIBLE_ADDRESS = 'COMPATIBLE_ADDRESS',
}

enum SendSpeedBump {
  SELF_SEND_SPEED_BUMP = 'SELF_SEND_SPEED_BUMP',
  SMART_CONTRACT_SPEED_BUMP = 'SMART_CONTRACT_SPEED_BUMP',
  NEW_ADDRESS_SPEED_BUMP = 'NEW_ADDRESS_SPEED_BUMP',
  COMPATIBLE_ADDRESS = 'COMPATIBLE_ADDRESS',
}

function SendFormInner({ disableTokenInputs = false, onCurrencyChange }: SendFormProps) {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const { setScreen } = useTransactionModalContext()

  const accountDrawer = useAccountDrawer()

  const [sendFormModalState, setSendFormModalState] = useState(SendFormModalState.None)
  const [sendFormSpeedBumpState, setSendFormSpeedBumpState] = useState({
    [SendSpeedBump.SELF_SEND_SPEED_BUMP]: false,
    [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: false,
    [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: false,
    [SendSpeedBump.COMPATIBLE_ADDRESS]: false,
  })
  const { sendState, derivedSendInfo } = useSendContext()
  const { inputError, recipientData } = derivedSendInfo
  const inputCurrencyId = currencyId(sendState.inputCurrency)
  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const chainId = sendState.inputCurrency?.chainId ?? defaultChainId
  const { tokenWarningDismissed: isCompatibleAddressDismissed } = useDismissedCompatibleAddressWarnings(
    inputCurrencyInfo?.currency,
  )
  const isUnichainBridgedAsset = Boolean(inputCurrencyInfo?.isBridged) && !isCompatibleAddressDismissed

  const { isSmartContractAddress, loading: loadingSmartContractAddress } = useIsSmartContractAddress(
    recipientData?.address,
    chainId,
  )

  const { isDisconnected } = useConnectionStatus()

  const accountAddress = useActiveAddress(chainId)
  const chainPlatform = chainIdToPlatform(chainId)

  const { isPermissionedSendBlocked, isPermissionedSendBlockedLoading, permissionedSendBlockReason } =
    useIsPermissionedSendBlocked({
      sendCurrency: inputCurrencyInfo?.currency,
      senderAddress: accountAddress,
      recipientAddress: recipientData?.address,
    })
  const sendCurrency = inputCurrencyInfo?.currency
  const { transfers: recentTransfers, loading: transfersLoading } = useRecentTransfersByAddress(accountAddress)
  const isRecentAddress = useMemo(() => {
    if (!recipientData?.address) {
      return undefined
    }

    return !!recentTransfers.find((transfer) =>
      areAddressesEqual({
        addressInput1: { address: transfer.address, platform: chainPlatform },
        addressInput2: { address: recipientData.address, platform: chainPlatform },
      }),
    )
  }, [recentTransfers, recipientData?.address, chainPlatform])

  const isCurrentWallet = useMemo(() => {
    return areAddressesEqual({
      addressInput1: { address: accountAddress, platform: chainPlatform },
      addressInput2: { address: recipientData?.address, platform: chainPlatform },
    })
  }, [accountAddress, recipientData?.address, chainPlatform])

  const sendButtonState = useSendButtonState()

  const handleModalState = useCallback((newState?: SendFormModalState) => {
    setSendFormModalState(newState ?? SendFormModalState.None)
  }, [])

  useEffect(() => {
    setSendFormSpeedBumpState(() => ({
      [SendSpeedBump.SELF_SEND_SPEED_BUMP]: isCurrentWallet,
      [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: isSmartContractAddress,
      [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: !isRecentAddress,
      [SendSpeedBump.COMPATIBLE_ADDRESS]: isUnichainBridgedAsset,
    }))
  }, [isCurrentWallet, isRecentAddress, isSmartContractAddress, recipientData?.address, isUnichainBridgedAsset])

  const handleSendButton = useCallback(
    (prevSpeedBump?: SendSpeedBump) => {
      if (
        prevSpeedBump !== SendSpeedBump.SELF_SEND_SPEED_BUMP &&
        sendFormSpeedBumpState[SendSpeedBump.SELF_SEND_SPEED_BUMP]
      ) {
        handleModalState(SendFormModalState.SELF_SEND_SPEED_BUMP)
        return
      }

      if (
        prevSpeedBump !== SendSpeedBump.SMART_CONTRACT_SPEED_BUMP &&
        sendFormSpeedBumpState[SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]
      ) {
        handleModalState(SendFormModalState.SMART_CONTRACT_SPEED_BUMP)
        return
      }

      if (
        prevSpeedBump !== SendSpeedBump.NEW_ADDRESS_SPEED_BUMP &&
        sendFormSpeedBumpState[SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]
      ) {
        handleModalState(SendFormModalState.NEW_ADDRESS_SPEED_BUMP)
        return
      }

      if (
        prevSpeedBump !== SendSpeedBump.COMPATIBLE_ADDRESS &&
        sendFormSpeedBumpState[SendSpeedBump.COMPATIBLE_ADDRESS]
      ) {
        handleModalState(SendFormModalState.COMPATIBLE_ADDRESS)
        return
      }

      setScreen(TransactionScreen.Review)
    },
    [handleModalState, sendFormSpeedBumpState, setScreen],
  )

  const handleConfirmSelfSendSpeedBump = useCallback(() => {
    setSendFormSpeedBumpState((prev) => ({
      ...prev,
      [SendSpeedBump.SELF_SEND_SPEED_BUMP]: false,
    }))
    handleModalState(SendFormModalState.None)
    handleSendButton(SendSpeedBump.SELF_SEND_SPEED_BUMP)
  }, [handleModalState, handleSendButton])

  const handleCancelSelfSendSpeedBump = useCallback(() => handleModalState(SendFormModalState.None), [handleModalState])

  const handleConfirmSmartContractSpeedBump = useCallback(() => {
    setSendFormSpeedBumpState((prev) => ({
      ...prev,
      [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: false,
    }))
    handleModalState(SendFormModalState.None)
    handleSendButton(SendSpeedBump.SMART_CONTRACT_SPEED_BUMP)
  }, [handleModalState, handleSendButton])

  const handleCancelSmartContractSpeedBump = useCallback(
    () => handleModalState(SendFormModalState.None),
    [handleModalState],
  )

  const handleConfirmNewAddressSpeedBump = useCallback(() => {
    setSendFormSpeedBumpState((prev) => ({
      ...prev,
      [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: false,
    }))
    handleModalState(SendFormModalState.None)
    handleSendButton(SendSpeedBump.NEW_ADDRESS_SPEED_BUMP)
  }, [handleModalState, handleSendButton])

  const handleCancelNewAddressSpeedBump = useCallback(
    () => handleModalState(SendFormModalState.None),
    [handleModalState],
  )

  const handleConfirmCompatibleAddressSpeedBump = useCallback(() => {
    setSendFormSpeedBumpState((prev) => ({
      ...prev,
      [SendSpeedBump.COMPATIBLE_ADDRESS]: false,
    }))
    handleModalState(SendFormModalState.None)
    handleSendButton(SendSpeedBump.COMPATIBLE_ADDRESS)
  }, [handleModalState, handleSendButton])

  const handleCancelCompatibleAddressSpeedBump = useCallback(
    () => handleModalState(SendFormModalState.None),
    [handleModalState],
  )

  const buttonDisabled =
    !!inputError ||
    loadingSmartContractAddress ||
    transfersLoading ||
    sendButtonState.disabled ||
    isPermissionedSendBlocked ||
    isPermissionedSendBlockedLoading

  return (
    <>
      <Flex gap="$spacing8">
        <SendCurrencyInputForm disabled={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
        <SendRecipientForm disabled={disableTokenInputs} />
        {/* Permissioned-token sends are blocked when the sender or the recipient isn't allowlisted
            for the token. The verify-identity CTA lives on Swap/TDP; here we just explain why the
            send is blocked, with sender- vs recipient-specific copy. */}
        {isPermissionedSendBlocked && (
          <Flex
            row
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            p="$padding12"
            gap="$spacing12"
            alignItems="flex-start"
          >
            <Lock size="$icon.20" color="$neutral2" flexShrink={0} />
            <Flex flex={1} gap="$spacing2">
              <Text variant="body3" color="$neutral1">
                {permissionedSendBlockReason === 'sender'
                  ? t('permissionedPool.send.senderNotAllowlisted.title')
                  : t('permissionedPool.send.recipientNotAllowlisted.title')}
              </Text>
              <Text variant="body3" color="$neutral2">
                {permissionedSendBlockReason === 'sender'
                  ? t('permissionedPool.send.senderNotAllowlisted.message', {
                      tokenSymbol: sendCurrency?.symbol ?? '',
                    })
                  : t('permissionedPool.send.recipientNotAllowlisted.message', {
                      tokenSymbol: sendCurrency?.symbol ?? '',
                    })}
              </Text>
            </Flex>
          </Flex>
        )}
        {isDisconnected ? (
          <Trace
            logPress
            eventOnTrigger={InterfaceEventName.ConnectWalletButtonClicked}
            element={ElementName.ConnectWalletButton}
          >
            <Flex row>
              <Button variant="branded" emphasis="secondary" size="large" fill onPress={accountDrawer.open}>
                {t('common.connectWallet.button')}
              </Button>
            </Flex>
          </Trace>
        ) : (
          <Trace logPress element={ElementName.SendButton}>
            <Flex row>
              <Button
                variant="branded"
                emphasis="primary"
                size="large"
                fill
                disabled={buttonDisabled}
                onPress={() => handleSendButton()}
              >
                {sendButtonState.label}
              </Button>
            </Flex>
          </Trace>
        )}
      </Flex>
      <SelfSendSpeedBumpModal
        isOpen={sendFormModalState === SendFormModalState.SELF_SEND_SPEED_BUMP}
        onConfirm={handleConfirmSelfSendSpeedBump}
        onDismiss={handleCancelSelfSendSpeedBump}
      />
      <SmartContractSpeedBumpModal
        isOpen={sendFormModalState === SendFormModalState.SMART_CONTRACT_SPEED_BUMP}
        onConfirm={handleConfirmSmartContractSpeedBump}
        onDismiss={handleCancelSmartContractSpeedBump}
      />
      <NewAddressSpeedBumpModal
        isOpen={sendFormModalState === SendFormModalState.NEW_ADDRESS_SPEED_BUMP}
        onConfirm={handleConfirmNewAddressSpeedBump}
        onDismiss={handleCancelNewAddressSpeedBump}
      />
      {inputCurrencyInfo && (
        <CompatibleAddressModal
          isOpen={sendFormModalState === SendFormModalState.COMPATIBLE_ADDRESS}
          onClose={handleCancelCompatibleAddressSpeedBump}
          onAcknowledge={handleConfirmCompatibleAddressSpeedBump}
          currencyInfo={inputCurrencyInfo}
          closeHeaderComponent={
            <GetHelpHeader
              closeModal={handleCancelCompatibleAddressSpeedBump}
              link={UniswapHelpUrls.articles.bridgedAssets}
              mb="$spacing12"
            />
          }
        />
      )}
    </>
  )
}

export function SendForm(props: SendFormProps) {
  const { setSendState, derivedSendInfo } = useSendContext()
  const { parsedTokenAmount, recipientData, transaction, gasFee } = derivedSendInfo
  const { closeModal } = useModalState(ModalName.Send)
  const account = useAccount()
  const sendChainId = parsedTokenAmount?.currency.chainId

  const sendCallback = useSendCallback({
    currencyAmount: parsedTokenAmount,
    recipient: recipientData?.address,
    transactionRequest: transaction,
    gasFee,
  })

  const {
    mutate: handleSend,
    isPending: isConfirming,
    error: sendError,
    isError,
    reset: resetSendMutation,
  } = useMutation({
    mutationFn: sendCallback,
    onSuccess: () => {
      closeModal()
      setSendState((prev) => ({
        ...prev,
        exactAmountToken: undefined,
        exactAmountFiat: '',
        recipient: '',
        validatedRecipientData: undefined,
        inputInFiat: true,
      }))
    },
    onError: (error) => {
      // User rejections are expected — don't log them or surface a callout.
      if (error instanceof UserRejectedRequestError) {
        return
      }
      // Don't log the raw provider error: ethers v5 gas-estimation/submission errors can serialize the
      // tx object (to/from/value/calldata) into the message and ship it to Datadog RUM. A failed transfer
      // may never be public onchain, so log a synthetic error with only non-sensitive metadata.
      logger.error(new Error('Send transaction failed'), {
        tags: { file: 'SendForm.tsx', function: 'onError', chainId: sendChainId },
        extra: { connectorType: account.connector?.type },
      })
    },
  })

  // Surface non-user-rejection failures on the review screen. Clears on retry: re-invoking the
  // mutation resets isError to false (and flips isPending true), so the error hides on the next send.
  const hasError = isError && !(sendError instanceof UserRejectedRequestError)

  const { screen, setScreen } = useTransactionModalContext()

  // Clear a prior failure whenever the review screen (re)opens so a stale error from an earlier attempt
  // doesn't show before the user retries. A fresh failure this session still sets isError after confirm.
  useEffect(() => {
    if (screen === TransactionScreen.Review) {
      resetSendMutation()
    }
  }, [screen, resetSendMutation])

  switch (screen) {
    case TransactionScreen.Form:
      return <SendFormInner {...props} />
    case TransactionScreen.Review:
      return (
        <SendReviewModalInner
          onConfirm={handleSend}
          onDismiss={() => setScreen(TransactionScreen.Form)}
          isConfirming={isConfirming}
          hasError={hasError}
        />
      )
    default:
      return null
  }
}
