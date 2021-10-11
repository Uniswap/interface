import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setBridgeModalState } from '../../../state/bridge/actions'
import { BridgeModalState } from '../../../state/bridge/reducer'
import { bridgeModalDataSelector } from '../../../state/bridge/selectors'
import { BridgeErrorModal } from './BridgeErrorModal'
import { BridgePendingModal } from './BridgePendingModal'
import { BridgeSuccesModal } from './BridgeSuccesModal'
import { BridgingInitiatedModal } from './BridgingInitiatedModal'

export interface BridgeModalProps {
  handleResetBridge: () => void
}

export const BridgeModal = ({ handleResetBridge }: BridgeModalProps) => {
  const dispatch = useDispatch()
  const { modalState, currencyId, fromNetworkName, toNetworkName, typedValue, modalError } = useSelector(
    bridgeModalDataSelector
  )
  const setModalState = (modalState: BridgeModalState) => dispatch(setBridgeModalState({ modalState }))

  const selectModal = () => {
    switch (modalState) {
      case BridgeModalState.INITIATED:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => setModalState(BridgeModalState.CLOSED)}
            amount={typedValue}
            assetType={currencyId ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={'Bridging Initiated'}
          />
        )
      case BridgeModalState.PENDING:
        return (
          <BridgePendingModal
            isOpen
            onDismiss={() => setModalState(BridgeModalState.CLOSED)}
            pendingText={`${typedValue} ${currencyId ?? ''} from ${fromNetworkName} to ${toNetworkName}`}
          />
        )
      case BridgeModalState.COLLECTING:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => setModalState(BridgeModalState.CLOSED)}
            amount={typedValue}
            assetType={currencyId ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={'Collecting Initiated'}
          />
        )

      case BridgeModalState.ERROR:
        return (
          <BridgeErrorModal isOpen onDismiss={() => setModalState(BridgeModalState.CLOSED)} error={modalError ?? ''} />
        )
      case BridgeModalState.SUCCESS:
        return (
          <BridgeSuccesModal
            isOpen
            amount={typedValue}
            assetType={currencyId ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            onDismiss={handleResetBridge}
            onTradeButtonClick={handleResetBridge}
            onBackButtonClick={handleResetBridge}
          />
        )
      default:
        return null
    }
  }

  return selectModal()
}
