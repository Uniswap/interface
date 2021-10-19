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
}

export const BridgeModal = ({ handleResetBridge, setStep, setStatus, modalData }: BridgeModalProps) => {
  const { status, currencyId, typedValue, fromNetwork, toNetwork, error } = modalData

  const toNetworkName = NETWORK_DETAIL[toNetwork.chainId].chainName
  const fromNetworkName = NETWORK_DETAIL[fromNetwork.chainId].chainName

  const selectModal = () => {
    switch (status) {
      case BridgeModalStatus.INITIATED:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => setStatus(BridgeModalStatus.CLOSED)}
            amount={typedValue}
            assetType={currencyId ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={'Bridging Initiated'}
          />
        )
      case BridgeModalStatus.PENDING:
        return (
          <BridgePendingModal
            isOpen
            onDismiss={() => setStatus(BridgeModalStatus.CLOSED)}
            pendingText={`${typedValue} ${currencyId ?? ''} from ${fromNetworkName} to ${toNetworkName}`}
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
            assetType={currencyId ?? ''}
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
            assetType={currencyId ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            onDismiss={() => {
              setStatus(BridgeModalStatus.CLOSED)
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
              setStatus(BridgeModalStatus.CLOSED)
              handleResetBridge()
            }}
            error={error ?? ''}
          />
        )
      case BridgeModalStatus.CLOSED:
        return (
          <BridgeDisclaimerModal
            isOpen
            onDismiss={() => {
              setStatus(BridgeModalStatus.CLOSED)
            }}
            msg={'eloszki'}
          />
        )
      default:
        return null
    }
  }

  return selectModal()
}
