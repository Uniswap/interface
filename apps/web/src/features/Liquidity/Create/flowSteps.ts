import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'

/**
 * Single source of truth for advancing through the create/add-liquidity flow. A new V2 pair needs
 * an initial price (PRICE_RANGE); an existing V2 pair has none and skips to DEPOSIT. V3/V4 advance
 * linearly SELECT → PRICE_RANGE → DEPOSIT.
 */
export function getNextFlowStep({
  currentStep,
  protocolVersion,
  creatingPoolOrPair,
}: {
  currentStep: PositionFlowStep
  protocolVersion: ProtocolVersion
  creatingPoolOrPair: boolean
}): PositionFlowStep {
  if (protocolVersion === ProtocolVersion.V2) {
    return currentStep === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER && creatingPoolOrPair
      ? PositionFlowStep.PRICE_RANGE
      : PositionFlowStep.DEPOSIT
  }

  return currentStep + 1
}
