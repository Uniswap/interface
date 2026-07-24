import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  areEarnPlanReuseIdentitiesCompatible,
  getEarnPlanReuseIdentityFromPlanResponse,
  getEarnPlanReuseIdentityFromTrade,
  getEarnPlanReuseIdentityFromValidatedInput,
} from 'uniswap/src/features/transactions/swap/plan/earnPlanReuseIdentity'
import type { EarnPlanReuseIdentity } from 'uniswap/src/features/transactions/swap/plan/earnPlanReuseIdentity'
import type { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import type { ChainedActionEarnIntent, Trade } from 'uniswap/src/features/transactions/swap/types/trade'

const VAULT_A = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
const VAULT_B = '0x999944272dc658575ba38f43c438447dded45999'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

type EarnPlanIdentityFixture = {
  earnIntent: ChainedActionEarnIntent
  inputToken: string
  inputTokenChainId: UniverseChainId
  terminalToken: string
  terminalTokenChainId: UniverseChainId
}

const CROSS_CONSTRUCTOR_FIXTURES: Array<[string, EarnPlanIdentityFixture]> = [
  [
    'deposit',
    {
      earnIntent: {
        action: TradingApi.EarnAction.DEPOSIT,
        vault: VAULT_A,
        chainId: TradingApi.ChainId._1,
      },
      inputToken: USDC,
      inputTokenChainId: UniverseChainId.Base,
      terminalToken: VAULT_A,
      terminalTokenChainId: UniverseChainId.Mainnet,
    },
  ],
  [
    'withdraw',
    {
      earnIntent: {
        action: TradingApi.EarnAction.WITHDRAW,
        vault: VAULT_A,
        chainId: TradingApi.ChainId._1,
        withdrawMode: TradingApi.EarnWithdrawMode.EXACT_ASSETS,
      },
      inputToken: VAULT_A,
      inputTokenChainId: UniverseChainId.Mainnet,
      terminalToken: USDC,
      terminalTokenChainId: UniverseChainId.Base,
    },
  ],
]

function createEarnReuseIdentity(overrides: Partial<EarnPlanReuseIdentity> = {}): EarnPlanReuseIdentity {
  return {
    action: TradingApi.EarnAction.DEPOSIT,
    vault: VAULT_A,
    chainId: UniverseChainId.Mainnet,
    inputToken: USDC,
    inputTokenChainId: UniverseChainId.Mainnet,
    terminalToken: VAULT_A,
    terminalTokenChainId: UniverseChainId.Mainnet,
    ...overrides,
  }
}

function createTradeFixture(fixture: EarnPlanIdentityFixture): Trade {
  return {
    routing: TradingApi.Routing.CHAINED,
    earnIntent: fixture.earnIntent,
    quote: {
      quote: {
        input: { token: fixture.inputToken },
        output: { token: fixture.terminalToken },
        tokenInChainId: fixture.inputTokenChainId,
        tokenOutChainId: fixture.terminalTokenChainId,
      },
    },
  } as unknown as Trade
}

function createPlanResponseFixture(fixture: EarnPlanIdentityFixture): TradingApi.PlanResponse {
  return {
    earnIntent: fixture.earnIntent,
    steps: [
      {
        tokenIn: fixture.inputToken,
        tokenInChainId: fixture.inputTokenChainId,
      },
      {
        tokenOut: fixture.terminalToken,
        tokenOutChainId: fixture.terminalTokenChainId,
      },
    ],
  } as unknown as TradingApi.PlanResponse
}

function createValidatedInputFixture(fixture: EarnPlanIdentityFixture): ValidatedTradeInput {
  return {
    tokenInAddress: fixture.inputToken,
    tokenInChainId: fixture.inputTokenChainId,
    tokenOutAddress: fixture.terminalToken,
    tokenOutChainId: fixture.terminalTokenChainId,
  } as unknown as ValidatedTradeInput
}

describe(areEarnPlanReuseIdentitiesCompatible, () => {
  it('preserves non-Earn behavior when neither side has Earn identity', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: undefined,
        currentIdentity: undefined,
      }),
    ).toBe(true)
  })

  it('rejects Earn plans when the current trade is not Earn', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity(),
        currentIdentity: undefined,
      }),
    ).toBe(false)
  })

  it('rejects non-Earn plans when the current trade is Earn', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: undefined,
        currentIdentity: createEarnReuseIdentity(),
      }),
    ).toBe(false)
  })

  it('rejects Earn plans for a different vault', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity(),
        currentIdentity: createEarnReuseIdentity({ vault: VAULT_B, terminalToken: VAULT_B }),
      }),
    ).toBe(false)
  })

  it('rejects Earn plans for a different mode', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity({ withdrawMode: TradingApi.EarnWithdrawMode.EXACT_ASSETS }),
        currentIdentity: createEarnReuseIdentity({ withdrawMode: TradingApi.EarnWithdrawMode.MAX_SHARES }),
      }),
    ).toBe(false)
  })

  it('rejects Earn plans for a different terminal token', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity({ terminalToken: USDC }),
        currentIdentity: createEarnReuseIdentity({ terminalToken: USDT }),
      }),
    ).toBe(false)
  })

  it('rejects Earn plans into the same vault from a different source token', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity(),
        currentIdentity: createEarnReuseIdentity({ inputToken: USDT }),
      }),
    ).toBe(false)
  })

  it('rejects Earn plans when only the source chain differs', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity({ inputTokenChainId: UniverseChainId.Mainnet }),
        currentIdentity: createEarnReuseIdentity({ inputTokenChainId: UniverseChainId.Base }),
      }),
    ).toBe(false)
  })

  it('rejects Earn plans when only the terminal chain differs', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity({ terminalTokenChainId: UniverseChainId.Mainnet }),
        currentIdentity: createEarnReuseIdentity({ terminalTokenChainId: UniverseChainId.Base }),
      }),
    ).toBe(false)
  })

  it('does not reject on partial plan data when a token is missing', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity({ inputToken: undefined }),
        currentIdentity: createEarnReuseIdentity(),
      }),
    ).toBe(true)
  })

  it('allows matching Earn identities without comparing quote ids', () => {
    expect(
      areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: createEarnReuseIdentity(),
        currentIdentity: createEarnReuseIdentity(),
      }),
    ).toBe(true)
  })

  it.each(CROSS_CONSTRUCTOR_FIXTURES)(
    'builds the same identity from trade, plan response, and validated input for %s',
    (_, fixture) => {
      const fromTrade = getEarnPlanReuseIdentityFromTrade(createTradeFixture(fixture))
      const fromPlanResponse = getEarnPlanReuseIdentityFromPlanResponse(createPlanResponseFixture(fixture))
      const fromValidatedInput = getEarnPlanReuseIdentityFromValidatedInput(
        createValidatedInputFixture(fixture),
        fixture.earnIntent,
      )

      expect(fromTrade).toEqual(fromPlanResponse)
      expect(fromTrade).toEqual(fromValidatedInput)
    },
  )
})
