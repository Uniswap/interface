import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'

export function flowToModalName(flow: TokenSelectorFlow): ModalNameType | undefined {
  switch (flow) {
    case TokenSelectorFlow.Swap:
      return ModalName.Swap
    case TokenSelectorFlow.Send:
      return ModalName.Send
    default:
      return undefined
  }
}
