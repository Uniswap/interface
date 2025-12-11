import { useMutation } from '@tanstack/react-query'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useGroupedRecentTransfers } from 'hooks/useGroupedRecentTransfers'
import { useModalState } from 'hooks/useModalState'
import { useSendCallback } from 'hooks/useSendCallback'
import { NewAddressSpeedBumpModal } from 'pages/Swap/Send/NewAddressSpeedBump'
import SendCurrencyInputForm from 'pages/Swap/Send/SendCurrencyInputForm'
import { SendRecipientForm } from 'pages/Swap/Send/SendRecipientForm'
import { SendReviewModalInner } from 'pages/Swap/Send/SendReviewModal'
import { SmartContractSpeedBumpModal } from 'pages/Swap/Send/SmartContractSpeedBump'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendContext } from 'state/send/SendContext'
import { CurrencyState } from 'state/swap/types'
import { Button, Flex } from 'ui/src'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useActiveAddress, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { ElementName, InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useDismissedCompatibleAddressWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { CompatibleAddressModal } from 'uniswap/src/features/transactions/modals/CompatibleAddressModal'
import { currencyId } from 'uniswap/src/utils/currencyId'

export type SendFormProps = {
  onCurrencyChange?: (selected: CurrencyState) => void
  disableTokenInputs?: boolean
}

function useSendButtonState() {
  const { sendState, derivedSendInfo } = useSendContext()
  const { recipient, inputCurrency } = sendState
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
  }, [recipient, recipientData, parsedTokenAmount, t, isSolanaToken])
}

enum SendFormModalState {
  None = 'None',
  SMART_CONTRACT_SPEED_BUMP = 'SMART_CONTRACT_SPEED_BUMP',
  NEW_ADDRESS_SPEED_BUMP = 'NEW_ADDRESS_SPEED_BUMP',
  COMPATIBLE_ADDRESS = 'COMPATIBLE_ADDRESS',
}

enum SendSpeedBump {
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
  const { transfers: recentTransfers, loading: transfersLoading } = useGroupedRecentTransfers(accountAddress)
  const isRecentAddress = useMemo(() => {
    if (!recipientData?.address) {
      return undefined
    }

    return !!recentTransfers?.[recipientData.address]
  }, [recentTransfers, recipientData?.address])

  const sendButtonState = useSendButtonState()

  const handleModalState = useCallback((newState?: SendFormModalState) => {
    setSendFormModalState(newState ?? SendFormModalState.None)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: +recipientData?.address
  useEffect(() => {
    setSendFormSpeedBumpState(() => ({
      [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: isSmartContractAddress,
      [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: !isRecentAddress,
      [SendSpeedBump.COMPATIBLE_ADDRESS]: isUnichainBridgedAsset,
    }))
  }, [isRecentAddress, isSmartContractAddress, recipientData?.address, isUnichainBridgedAsset])

  const handleSendButton = useCallback(
    (prevSpeedBump?: SendSpeedBump) => {
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

  const buttonDisabled = !!inputError || loadingSmartContractAddress || transfersLoading || sendButtonState.disabled

  return (
    <>
      <Flex gap="$spacing8">
        <SendCurrencyInputForm disabled={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
        <SendRecipientForm disabled={disableTokenInputs} />
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
                isDisabled={buttonDisabled}
                onPress={() => handleSendButton()}
              >
                {sendButtonState.label}
              </Button>
            </Flex>
          </Trace>
        )}
      </Flex>
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
              link={uniswapUrls.helpArticleUrls.bridgedAssets}
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

  const sendCallback = useSendCallback({
    currencyAmount: parsedTokenAmount,
    recipient: recipientData?.address,
    transactionRequest: transaction,
    gasFee,
  })

  const { mutate: handleSend, isPending: isConfirming } = useMutation({
    mutationFn: sendCallback,
    onSuccess: () => {
      closeModal()
      setSendState((prev) => ({
        ...prev,
        exactAmountToken: undefined,
        exactAmountFiat: '',
        recipient: '',
        validatedRecipient: undefined,
        inputInFiat: true,
      }))
    },
  })

  const { screen, setScreen } = useTransactionModalContext()
  switch (screen) {
    case TransactionScreen.Form:
      return <SendFormInner {...props} />
    case TransactionScreen.Review:
      return (
        <SendReviewModalInner
          onConfirm={handleSend}
          onDismiss={() => setScreen(TransactionScreen.Form)}
          isConfirming={isConfirming}
        />
      )
    default:
      return null
  }
}
