import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'

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
