import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import { useConnectionReady } from 'connection/eagerlyConnect'
import { getChainInfo } from 'constants/chainInfo'
import { useGroupedRecentTransfers } from 'hooks/useGroupedRecentTransfers'
import { useSendCallback } from 'hooks/useSendCallback'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SendContextProvider, useSendContext } from 'state/send/SendContext'
import { CurrencyState, useSwapAndLimitContext } from 'state/swap/SwapContext'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { useIsSmartContractAddress } from 'utils/transfer'

import { Trace } from 'analytics'
import { NewAddressSpeedBumpModal } from './NewAddressSpeedBump'
import SendCurrencyInputForm from './SendCurrencyInputForm'
import { SendRecipientForm } from './SendRecipientForm'
import { SendReviewModal } from './SendReviewModal'
import { SmartContractSpeedBumpModal } from './SmartContractSpeedBump'

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
        label: <Trans>Invalid recipient</Trans>,
        disabled: true,
      }
    }

    if (!parsedTokenAmount) {
      return {
        label: <Trans>Input amount</Trans>,
        disabled: true,
      }
    }

    if (!recipient && !recipientData) {
      return {
        label: <Trans>Select recipient</Trans>,
        disabled: true,
      }
    }

    return {
      label: <Trans>Send</Trans>,
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
  const { account, chainId: connectedChainId, connector } = useWeb3React()
  const switchChain = useSwitchChain()
  const connectionReady = useConnectionReady()
  const toggleWalletDrawer = useToggleAccountDrawer()

  const [sendFormModalState, setSendFormModalState] = useState(SendFormModalState.None)
  const [sendFormSpeedBumpState, setSendFormSpeedBumpState] = useState({
    [SendSpeedBump.NEW_ADDRESS_SPEED_BUMP]: false,
    [SendSpeedBump.SMART_CONTRACT_SPEED_BUMP]: false,
  })
  const { chainId } = useSwapAndLimitContext()
  const { setSendState, derivedSendInfo } = useSendContext()
  const { inputError, parsedTokenAmount, recipientData, transaction } = derivedSendInfo

  const { isSmartContractAddress, loading: loadingSmartContractAddress } = useIsSmartContractAddress(
    recipientData?.address
  )
  const { transfers: recentTransfers, loading: transfersLoading } = useGroupedRecentTransfers(account)
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
    [handleModalState, sendFormSpeedBumpState]
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
    [handleModalState]
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
    [handleModalState]
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
        {connectionReady && !account ? (
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
            element={InterfaceElementName.CONNECT_WALLET_BUTTON}
          >
            <ButtonLight onClick={toggleWalletDrawer} fontWeight={535} $borderRadius="16px">
              <Trans>Connect wallet</Trans>
            </ButtonLight>
          </TraceEvent>
        ) : chainId && chainId !== connectedChainId ? (
          <ButtonPrimary
            $borderRadius="16px"
            onClick={async () => {
              try {
                await switchChain(connector, chainId)
              } catch (error) {
                if (didUserReject(error)) {
                  // Ignore error, which keeps the user on the previous chain.
                } else {
                  // TODO(WEB-3306): This UX could be improved to show an error state.
                  throw error
                }
              }
            }}
          >
            <Trans>Connect to {getChainInfo(chainId)?.label}</Trans>
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
    <Trace page="send-page">
      <SendContextProvider>
        <SendFormInner {...props} />
      </SendContextProvider>
    </Trace>
  )
}
