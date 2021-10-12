import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setBridgeModalData, setBridgeModalStatus } from '../../../state/bridge/actions'
import { BridgeModal, BridgeModalStatus, BridgeNetworkInput } from '../../../state/bridge/reducer'
import { bridgeModalDataSelector } from '../../../state/bridge/selectors'
import { BridgeStep } from '../utils'
import { BridgeErrorModal } from './BridgeErrorModal'
import { BridgePendingModal } from './BridgePendingModal'
import { BridgeSuccesModal } from './BridgeSuccesModal'
import { BridgingInitiatedModal } from './BridgingInitiatedModal'
import { NETWORK_DETAIL } from '../../../constants'

export interface BridgeModalProps {
  handleResetBridge: () => void
  setStep: (step: BridgeStep) => void
  modalData: BridgeModal
}

export const BridgeModal = ({ handleResetBridge, setStep, modalData }: BridgeModalProps) => {
  // const dispatch = useDispatch()
  // const { state, currencyId, fromNetworkName, toNetworkName, typedValue, error } = useSelector(bridgeModalDataSelector)
  // const setModalState = (state: BridgeModalStatus) => dispatch(setBridgeModalStatus({ state }))
  const { status, currencyId, typedValue, fromNetwork, toNetwork, error } = modalData

  const toNetworkName = NETWORK_DETAIL[toNetwork.chainId].chainName
  const fromNetworkName = NETWORK_DETAIL[fromNetwork.chainId].chainName

  const selectModal = () => {
    switch (status) {
      case BridgeModalStatus.INITIATED:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => setBridgeModalStatus(BridgeModalStatus.CLOSED)}
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
            onDismiss={() => setModalState(BridgeModalStatus.CLOSED)}
            pendingText={`${typedValue} ${currencyId ?? ''} from ${fromNetworkName} to ${toNetworkName}`}
          />
        )
      case BridgeModalStatus.COLLECTING:
        return (
          <BridgingInitiatedModal
            isOpen
            onDismiss={() => {
              setBridgeModalStatus(BridgeModalStatus.CLOSED)
              setStep(BridgeStep.Initial)
            }}
            amount={typedValue}
            assetType={currencyId ?? ''}
            fromNetworkName={fromNetworkName}
            toNetworkName={toNetworkName}
            heading={'Collecting Initiated'}
          />
        )

      case BridgeModalStatus.ERROR:
        return (
          <BridgeErrorModal
            isOpen
            onDismiss={() => setBridgeModalStatus(BridgeModalStatus.ERROR)}
            error={error ?? ''}
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
              setBridgeModalStatus(BridgeModalStatus.CLOSED)
              handleResetBridge()
            }}
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
