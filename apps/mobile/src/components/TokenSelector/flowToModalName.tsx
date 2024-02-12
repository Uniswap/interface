import { TokenSelectorFlow } from 'src/components/TokenSelector/types'
import { ModalName } from 'src/features/telemetry/constants'

export function flowToModalName(flow: TokenSelectorFlow): ModalName | undefined {
  switch (flow) {
    case TokenSelectorFlow.Swap:
      return ModalName.Swap
    case TokenSelectorFlow.Transfer:
      return ModalName.Send
    default:
      return undefined
  }
}
