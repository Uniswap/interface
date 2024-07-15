import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { useIsSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useGroupedRecentTransfers } from 'hooks/useGroupedRecentTransfers'
import useSelectChain from 'hooks/useSelectChain'
import { useSendCallback } from 'hooks/useSendCallback'
import { Trans } from 'i18n'
import { NewAddressSpeedBumpModal } from 'pages/Swap/Send/NewAddressSpeedBump'
import SendCurrencyInputForm from 'pages/Swap/Send/SendCurrencyInputForm'
import { SendRecipientForm } from 'pages/Swap/Send/SendRecipientForm'
import { SendReviewModal } from 'pages/Swap/Send/SendReviewModal'
import { SmartContractSpeedBumpModal } from 'pages/Swap/Send/SmartContractSpeedBump'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SendContextProvider, useSendContext } from 'state/send/SendContext'
import { useSwapAndLimitContext } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { useIsSmartContractAddress } from 'utils/transfer'

type SendFormProps = {
  onCurrencyChange?: (selected: CurrencyState) => void
  disableTokenInputs?: boolean
}

function useSendButtonState() {
  const { sendState, derivedSendInfo } = useSendContext()
  const { recipient } = sendState
  const { parsedTokenAmount, recipientData } = derivedSendInfo

  return useMemo(() => {
    if (recipient && !recipientData) {
      return {
        label: <Trans i18nKey="common.invalidRecipient.error" />,
        disabled: true,
      }
    }

    if (!parsedTokenAmount) {
      return {
        label: <Trans i18nKey="common.amountInput.placeholder" />,
        disabled: true,
      }
    }

    if (!recipient && !recipientData) {
      return {
        label: <Trans i18nKey="common.input.noRecipient.error" />,
        disabled: true,
      }
    }

    return {
      label: <Trans i18nKey="common.send.button" />,
      disabled: false,
    }
  }, [parsedTokenAmount, recipient, recipientData])
}

enum SendFormModalState {
  None = 'None',
  SMART_CONTRACT_SPEED_BUMP = 'SMART_CONTRACT_SPEED_BUMP',
  NEW_ADDRESS_SPEED_BUMP = 'NEW_ADDRESS_SPEED_BUMP',
  REVIEW = 'REVIEW',
}

enum SendSpeedBump {
  SMART_CONTRACT_SPEED_BUMP = 'SMART_CONTRACT_SPEED_BUMP',
  NEW_ADDRESS_SPEED_BUMP = 'NEW_ADDRESS_SPEED_BUMP',
}

function SendFormInner({ disableTokenInputs = false, onCurrencyChange }: SendFormProps) {
  const account = useAccount()
  const selectChain = useSelectChain()

  const accountDrawer = useAccountDrawer()

  const [sendFormModalState, setSendFormModalState] = useState(SendFormModalState.None)
  const [sendFormSpeedBumpState, setSendFormSpeedBumpState] = useState({
    [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: false,
    [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: false,
  })
  const { initialChainId, chainId, multichainUXEnabled } = useSwapAndLimitContext()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const { setSendState, derivedSendInfo } = useSendContext()
  const { inputError, parsedTokenAmount, recipientData, transaction, gasFee } = derivedSendInfo

  const { isSmartContractAddress, loading: loadingSmartContractAddress } = useIsSmartContractAddress(
    recipientData?.address,
  )
  const { transfers: recentTransfers, loading: transfersLoading } = useGroupedRecentTransfers(account.address)
  const isRecentAddress = useMemo(() => {
    if (!recipientData?.address) {
      return undefined
    }

    return !!recentTransfers?.[recipientData.address]
  }, [recentTransfers, recipientData?.address])

  const sendButtonState = useSendButtonState()
  const sendCallback = useSendCallback({
    currencyAmount: parsedTokenAmount,
    recipient: recipientData?.address,
    transactionRequest: transaction,
    gasFee,
  })

  const handleModalState = useCallback((newState?: SendFormModalState) => {
    setSendFormModalState(newState ?? SendFormModalState.None)
  }, [])

  useEffect(() => {
    setSendFormSpeedBumpState(() => ({
      [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: isSmartContractAddress,
      [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: !isRecentAddress,
    }))
  }, [isRecentAddress, isSmartContractAddress, recipientData?.address])

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

      handleModalState(SendFormModalState.REVIEW)
    },
    [handleModalState, sendFormSpeedBumpState],
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

  const handleSend = useCallback(() => {
    sendCallback()
      .then(() => {
        handleModalState(SendFormModalState.None)
        setSendState((prev) => ({
          ...prev,
          exactAmountToken: undefined,
          exactAmountFiat: '',
          recipient: '',
          validatedRecipient: undefined,
          inputInFiat: true,
        }))
      })
      .catch(() => undefined)
  }, [handleModalState, sendCallback, setSendState])

  return (
    <>
      <Column gap="xs">
        <SendCurrencyInputForm disabled={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
        <SendRecipientForm disabled={disableTokenInputs} />
        {account.isDisconnected ? (
          <Trace
            logPress
            eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
            element={InterfaceElementName.CONNECT_WALLET_BUTTON}
          >
            <ButtonLight onClick={accountDrawer.open} fontWeight={535} $borderRadius="16px">
              <Trans i18nKey="common.connectWallet.button" />
            </ButtonLight>
          </Trace>
        ) : !multichainUXEnabled && initialChainId && initialChainId !== account.chainId ? (
          <ButtonPrimary $borderRadius="16px" onClick={async () => await selectChain(initialChainId)}>
            <Trans
              i18nKey="common.connectToChain.button"
              values={{ chainName: isSupportedChain ? UNIVERSE_CHAIN_INFO[initialChainId].label : undefined }}
            />
          </ButtonPrimary>
        ) : (
          <ButtonPrimary
            fontWeight={535}
            disabled={!!inputError || loadingSmartContractAddress || transfersLoading || sendButtonState.disabled}
            onClick={() => handleSendButton()}
          >
            {sendButtonState.label}
          </ButtonPrimary>
        )}
      </Column>
      {sendFormModalState === SendFormModalState.REVIEW ? (
        <SendReviewModal onConfirm={handleSend} onDismiss={() => handleModalState(SendFormModalState.None)} />
      ) : sendFormModalState === SendFormModalState.SMART_CONTRACT_SPEED_BUMP ? (
        <SmartContractSpeedBumpModal
          onCancel={handleCancelSmartContractSpeedBump}
          onConfirm={handleConfirmSmartContractSpeedBump}
        />
      ) : sendFormModalState === SendFormModalState.NEW_ADDRESS_SPEED_BUMP ? (
        <NewAddressSpeedBumpModal
          onCancel={handleCancelNewAddressSpeedBump}
          onConfirm={handleConfirmNewAddressSpeedBump}
        />
      ) : null}
    </>
  )
}

export function SendForm(props: SendFormProps) {
  return (
    <Trace page={InterfacePageNameLocal.Send}>
      <SendContextProvider>
        <SendFormInner {...props} />
      </SendContextProvider>
    </Trace>
  )
}
