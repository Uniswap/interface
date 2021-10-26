import React from 'react'
import { BridgeModalState, BridgeModalStatus } from '../../../state/bridge/reducer'
import { BridgeStep } from '../utils'
import { BridgeErrorModal } from './BridgeErrorModal'
import { BridgePendingModal } from './BridgePendingModal'
import { BridgeSuccesModal } from './BridgeSuccesModal'
import { BridgingInitiatedModal } from './BridgingInitiatedModal'
import { NETWORK_DETAIL } from '../../../constants'
import { BridgeDisclaimerModal } from './BridgeDisclaimerModal'

export interface BridgeModalProps {
  handleResetBridge: () => void
  setStep: (step: BridgeStep) => void
  setStatus: (status: BridgeModalStatus, error?: string) => void
  modalData: BridgeModalState
  handleSubmit: () => void
}

const setDisclaimerText = (isArbitrum: boolean) => {
  if (isArbitrum) return 'It will take ~1 week for you to see your balance credited on L1. '
  return 'It will take 10 minutes for you to see your balance credited on L2. Moving your funds back to L1 Ethereum (if you later wish to do so) takes ~1 week. '
}

export const BridgeModal = ({ handleResetBridge, setStep, setStatus, modalData, handleSubmit }: BridgeModalProps) => {
  const { status, symbol, typedValue, fromNetwork, toNetwork, error } = modalData

  const toNetworkName = NETWORK_DETAIL[toNetwork.chainId].chainName
  const fromNetworkName = NETWORK_DETAIL[fromNetwork.chainId].chainName
  const txType = NETWORK_DETAIL[fromNetwork.chainId].isArbitrum ? 'Withdraw' : 'Deposit'
  const disclaimerText = setDisclaimerText(NETWORK_DETAIL[fromNetwork.chainId].isArbitrum)

  const selectModal = () => {
    switch (status) {
      case BridgeModalStatus.INITIATED:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => setStatus(BridgeModalStatus.CLOSED)}
            amount={typedValue}
            assetType={symbol ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={'Transaction Initiated'}
          />
        )
      case BridgeModalStatus.PENDING:
        return (
          <BridgePendingModal
            isOpen
            onDismiss={() => setStatus(BridgeModalStatus.CLOSED)}
            pendingText={`${typedValue} ${symbol ?? ''} from ${fromNetworkName} to ${toNetworkName}`}
          />
        )
      case BridgeModalStatus.COLLECTING:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => {
              setStatus(BridgeModalStatus.CLOSED)
              setStep(BridgeStep.Initial)
            }}
            amount={typedValue}
            assetType={symbol ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={'Collecting Initiated'}
          />
        )
      case BridgeModalStatus.SUCCESS:
        return (
          <BridgeSuccesModal
            isOpen
            amount={typedValue}
            assetType={symbol ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            onDismiss={() => {
              handleResetBridge()
            }}
            onTradeButtonClick={handleResetBridge}
            onBackButtonClick={handleResetBridge}
          />
        )
      case BridgeModalStatus.ERROR:
        return (
          <BridgeErrorModal
            isOpen
            onDismiss={() => {
              handleResetBridge()
            }}
            error={error ?? ''}
          />
        )
      case BridgeModalStatus.DISCLAIMER:
        return (
          <BridgeDisclaimerModal
            isOpen
            onConfirm={handleSubmit}
            onDismiss={handleResetBridge}
            amount={typedValue}
            assetType={symbol ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={txType}
            disclaimerText={disclaimerText}
          />
        )
      case BridgeModalStatus.APPROVE:
        return (
          <BridgePendingModal
            isOpen
            onDismiss={() => setStatus(BridgeModalStatus.CLOSED)}
            pendingText={`Set allowance for ${fromNetworkName} L1 router contract to bridge your ${symbol} tokens to L2 ${toNetworkName}`}
          />
        )
      default:
        return null
    }
  }

  return selectModal()
}
