import React from 'react'
import { ChainId } from '@swapr/sdk'
import { ButtonPrimary } from '../../components/Button'
import { useNetworkSwitch } from '../../hooks/useNetworkSwitch'
import { useWalletSwitcherPopoverToggle } from '../../state/application/hooks'
import { BridgeStep } from './utils'
import { NetworkSwitcher } from './NetworkSwitcher'
import { BridgeButton } from './BridgeButton'
import { networkOptionsPreset } from '../../components/NetworkSwitcher'

export type BridgeActionPanelProps = {
  account: string | null | undefined
  fromNetworkChainId: ChainId
  toNetworkChainId: ChainId
  isNetworkConnected: boolean
  step: BridgeStep
  setStep: (step: BridgeStep) => void
  handleSubmit: () => void
  handleCollect: () => void
  typedValue: string
}

export const BridgeActionPanel = ({
  step,
  account,
  typedValue,
  handleSubmit,
  handleCollect,
  toNetworkChainId,
  fromNetworkChainId,
  isNetworkConnected
}: BridgeActionPanelProps) => {
  const { selectEthereum, selectNetwork } = useNetworkSwitch()
  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()

  const isButtonDisabled = !typedValue || step !== BridgeStep.Initial

  const chooseButton = () => {
    if (!account) {
      return (
        <ButtonPrimary mt="12px" onClick={toggleWalletSwitcherPopover}>
          Connect Wallet
        </ButtonPrimary>
      )
    }

    if (!isNetworkConnected && step !== BridgeStep.Collect) {
      return (
        <ButtonPrimary
          mt="12px"
          onClick={() =>
            fromNetworkChainId === ChainId.MAINNET ? selectEthereum() : selectNetwork(fromNetworkChainId)
          }
        >
          Connect to {networkOptionsPreset.find(network => network.chainId === fromNetworkChainId)?.name}
        </ButtonPrimary>
      )
    }

    switch (step) {
      case BridgeStep.Collect:
        return (
          <NetworkSwitcher
            sendToId={toNetworkChainId}
            onSwitchClick={() =>
              toNetworkChainId === ChainId.MAINNET ? selectEthereum() : selectNetwork(toNetworkChainId)
            }
            onCollectClick={handleCollect}
          />
        )
    }

    return (
      <BridgeButton to={toNetworkChainId} from={fromNetworkChainId} disabled={isButtonDisabled} onClick={handleSubmit}>
        {!typedValue
          ? 'Enter amount'
          : `Brigde to ${networkOptionsPreset.find(network => network.chainId === toNetworkChainId)?.name}`}
      </BridgeButton>
    )
  }

  return chooseButton()
}
