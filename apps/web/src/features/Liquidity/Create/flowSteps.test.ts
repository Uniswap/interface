import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'

describe('getNextFlowStep', () => {
  describe('V2', () => {
    it('goes to PRICE_RANGE from token selection when creating a new pair (needs an initial price)', () => {
      expect(
        getNextFlowStep({
          currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
          protocolVersion: ProtocolVersion.V2,
          creatingPoolOrPair: true,
        }),
      ).toBe(PositionFlowStep.PRICE_RANGE)
    })

    it('skips PRICE_RANGE and goes straight to DEPOSIT for an existing pair', () => {
      expect(
        getNextFlowStep({
          currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
          protocolVersion: ProtocolVersion.V2,
          creatingPoolOrPair: false,
        }),
      ).toBe(PositionFlowStep.DEPOSIT)
    })

    it('goes to DEPOSIT from the price step (after setting an initial price for a new pair)', () => {
      expect(
        getNextFlowStep({
          currentStep: PositionFlowStep.PRICE_RANGE,
          protocolVersion: ProtocolVersion.V2,
          creatingPoolOrPair: true,
        }),
      ).toBe(PositionFlowStep.DEPOSIT)
    })
  })

  describe.each([ProtocolVersion.V3, ProtocolVersion.V4])('protocol %s', (protocolVersion) => {
    it('advances SELECT_TOKENS_AND_FEE_TIER -> PRICE_RANGE for an existing pool', () => {
      expect(
        getNextFlowStep({
          currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
          protocolVersion,
          creatingPoolOrPair: false,
        }),
      ).toBe(PositionFlowStep.PRICE_RANGE)
    })

    it('advances SELECT_TOKENS_AND_FEE_TIER -> PRICE_RANGE when creating a pool', () => {
      expect(
        getNextFlowStep({
          currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
          protocolVersion,
          creatingPoolOrPair: true,
        }),
      ).toBe(PositionFlowStep.PRICE_RANGE)
    })

    it('advances PRICE_RANGE -> DEPOSIT', () => {
      expect(
        getNextFlowStep({
          currentStep: PositionFlowStep.PRICE_RANGE,
          protocolVersion,
          creatingPoolOrPair: false,
        }),
      ).toBe(PositionFlowStep.DEPOSIT)
    })
  })
})
