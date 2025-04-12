import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapTab } from 'uniswap/src/types/screens/interface'

export enum PopupType {
  Transaction = 'transaction',
  Order = 'order',
  FailedSwitchNetwork = 'failedSwitchNetwork',
  SwitchNetwork = 'switchNetwork',
  Bridge = 'bridge',
}

export type PopupContent =
  | {
      type: PopupType.Transaction
      hash: string
    }
  | {
      type: PopupType.Order
      orderHash: string
    }
  | {
      type: PopupType.FailedSwitchNetwork
      failedSwitchNetwork: UniverseChainId
    }
  | {
      type: PopupType.SwitchNetwork
      chainId: UniverseChainId
      action: SwapTab
    }
  | {
      type: PopupType.Bridge
      inputChainId: UniverseChainId
      outputChainId: UniverseChainId
    }
