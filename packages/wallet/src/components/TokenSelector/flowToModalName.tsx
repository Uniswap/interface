import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { ModalName, ModalNameType } from 'wallet/src/telemetry/constants'

export function flowToModalName(flow: TokenSelectorFlow): ModalNameType | undefined {
  switch (flow) {
    case TokenSelectorFlow.Swap:
      return ModalName.Swap
    case TokenSelectorFlow.Transfer:
      return ModalName.Send
    default:
      return undefined
  }
}
