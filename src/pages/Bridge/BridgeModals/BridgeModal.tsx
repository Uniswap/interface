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

  return (
    <>
      <BridgePendingModal
        isOpen={modalState === BridgeModalState.PENDING}
        onDismiss={() => setModalState(BridgeModalState.CLOSED)}
        pendingText={`${typedValue} ${currencyId ?? ''} from ${fromNetworkName} to ${toNetworkName}`}
      />
      <BridgeErrorModal
        isOpen={modalState === BridgeModalState.ERROR}
        onDismiss={() => setModalState(BridgeModalState.CLOSED)}
        error={modalError ?? ''}
      />
      <BridgingInitiatedModal
        isOpen={modalState === BridgeModalState.INITIATED}
        onDismiss={() => setModalState(BridgeModalState.CLOSED)}
        amount={typedValue}
        assetType={currencyId ?? ''}
        fromNetworkName={fromNetworkName}
        toNetworkName={toNetworkName}
      />
      <BridgeSuccesModal
        isOpen={modalState === BridgeModalState.SUCCESS}
        onDismiss={handleResetBridge}
        onTradeButtonClick={handleResetBridge}
        onBackButtonClick={handleResetBridge}
        amount={typedValue}
      />
    </>
  )
}
