import type { MarginPlanStep } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import { MARGIN_ROUTER_ADDRESS } from '~/constants/margin'
import {
  isOpenCollateralBalanceInsufficient,
  resolveOpenWalletPull,
} from '~/pages/Swap/Margin/hooks/marginExecutionGuards'

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

function makeOpenStep(overrides: Partial<MarginPlanStep> = {}): MarginPlanStep {
  return {
    stepIndex: 0,
    stepType: 'MARGIN_OPEN',
    method: 'SEND_TX',
    payloadType: 'TX',
    payload: { to: '0xrouter', data: '0x', chainId: 1, value: '0x0' },
    status: 'AWAITING_ACTION',
    tokenIn: WETH,
    tokenInAmount: '1000000000000000',
    ...overrides,
  }
}

describe('resolveOpenWalletPull', () => {
  it('classifies the native sentinel tokenIn as a native pull', () => {
    const step = makeOpenStep({ tokenIn: MARGIN_NATIVE_TOKEN_ADDRESS })
    expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({ kind: 'native' })
  })

  it('classifies a missing tokenIn as a native pull', () => {
    const step = makeOpenStep({ tokenIn: undefined })
    expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({ kind: 'native' })
  })

  // An omitted tokenIn means native; a BLANK one means a reshaped wire field. Reading the blank as
  // native skipped the balance read altogether — the one degenerate value in this chain that failed
  // open. It now reaches the token path, where the address parse throws before anything broadcasts.
  it('does NOT treat a blank tokenIn as native', () => {
    const step = makeOpenStep({ tokenIn: '' })
    expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).not.toEqual({ kind: 'native' })
  })

  // The folded /plan reports a native open's tokenIn as the wrapped collateral (WETH) and
  // funds it via msg.value; a non-zero payload value is the ground-truth native signal.
  it('classifies a wrapNative open (tokenIn=WETH, msg.value>0) as a native pull', () => {
    const step = makeOpenStep({
      tokenIn: WETH,
      payload: { to: '0xrouter', data: '0x', chainId: 1, value: '0x5543df729c000' },
    })
    expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({ kind: 'native' })
  })

  it('classifies a token-funded open (msg.value 0) as a priced amount pull', () => {
    const step = makeOpenStep({
      tokenIn: USDC,
      tokenInAmount: '2837140',
      payload: { to: '0xrouter', data: '0x', chainId: 1, value: '0x0' },
    })
    expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({
      kind: 'amount',
      token: USDC,
      amount: 2837140n,
    })
  })

  it('classifies a token-funded open with no priced amount as unpriced', () => {
    const step = makeOpenStep({ tokenIn: USDC, tokenInAmount: undefined })
    expect(resolveOpenWalletPull({ plan: { steps: [step] }, step })).toEqual({ kind: 'unpriced', token: USDC })
  })

  // Every non-figure on the step's own field, through the same rule the permit reader uses. `'0'` is
  // the backend's stand-in for absence and `BigInt('')` is `0n` rather than a throw; a negative parses
  // cleanly. Each would classify as an exact pull no balance can fall short of, disarming the check.
  it.each([
    ['a "0" amount', '0'],
    ['a blank amount', ''],
    ['a negative amount', '-1'],
    ['an unparseable amount', 'not-a-number'],
  ])('treats %s as no figure and holds the empty-wallet floor', (_label, tokenInAmount) => {
    const step = makeOpenStep({ tokenIn: USDC, tokenInAmount })
    const pull = resolveOpenWalletPull({ plan: { steps: [step] }, step })
    expect(pull).toEqual({ kind: 'unpriced', token: USDC })
    expect(isOpenCollateralBalanceInsufficient({ balance: 0n, pull })).toBe(true)
  })

  // The permit fallback, which sizes the pull whenever the step carries no figure of its own.
  describe('collateral permit fallback', () => {
    const MAX_UINT160 = (1n << 160n) - 1n

    function makePermitStep(amount: string, stepIndex = 1): MarginPlanStep {
      return {
        stepIndex,
        stepType: 'APPROVAL_PERMIT',
        method: 'SIGN_MSG',
        payloadType: 'EIP712',
        payload: { values: { spender: MARGIN_ROUTER_ADDRESS, details: { token: USDC, amount } } },
        status: 'AWAITING_ACTION',
      } as unknown as MarginPlanStep
    }

    it('sizes the pull from a permit carrying a real figure', () => {
      const step = makeOpenStep({ tokenIn: USDC, tokenInAmount: undefined })
      expect(resolveOpenWalletPull({ plan: { steps: [step, makePermitStep('2837140')] }, step })).toEqual({
        kind: 'amount',
        token: USDC,
        amount: 2837140n,
      })
    })

    // A MaxUint160 permit is an allowance ceiling the backend signs so an equity resize stays covered —
    // reading it as the pull would fail every open closed.
    it('refuses the MaxUint160 allowance cap and stays unpriced', () => {
      const step = makeOpenStep({ tokenIn: USDC, tokenInAmount: undefined })
      expect(resolveOpenWalletPull({ plan: { steps: [step, makePermitStep(MAX_UINT160.toString())] }, step })).toEqual({
        kind: 'unpriced',
        token: USDC,
      })
    })

    // `'0'` passes the cap check, so taking it literally yields `{kind:'amount', amount: 0n}` — and
    // `balance < 0n` is never true, so the pre-broadcast check no-ops and the empty-wallet floor that
    // 'unpriced' exists to apply is skipped. Same non-figure rule as the step's own field.
    it('refuses a "0" permit amount and stays unpriced, so the empty-wallet floor still applies', () => {
      const step = makeOpenStep({ tokenIn: USDC, tokenInAmount: undefined })
      const pull = resolveOpenWalletPull({ plan: { steps: [step, makePermitStep('0')] }, step })
      expect(pull).toEqual({ kind: 'unpriced', token: USDC })
      expect(isOpenCollateralBalanceInsufficient({ balance: 0n, pull })).toBe(true)
    })

    // Refusing rather than returning: the scan keeps going, so a real permit behind a '0' one still
    // sizes the pull.
    it('keeps scanning past a "0" permit to a later real one', () => {
      const step = makeOpenStep({ tokenIn: USDC, tokenInAmount: undefined })
      expect(
        resolveOpenWalletPull({ plan: { steps: [step, makePermitStep('0', 1), makePermitStep('500', 2)] }, step }),
      ).toEqual({ kind: 'amount', token: USDC, amount: 500n })
    })
  })
})

describe('isOpenCollateralBalanceInsufficient', () => {
  it('never blocks a native pull (equity rides as msg.value)', () => {
    expect(isOpenCollateralBalanceInsufficient({ balance: 0n, pull: { kind: 'native' } })).toBe(false)
  })

  it('blocks an amount pull only when the balance is below the amount', () => {
    expect(
      isOpenCollateralBalanceInsufficient({ balance: 5n, pull: { kind: 'amount', token: USDC, amount: 10n } }),
    ).toBe(true)
    expect(
      isOpenCollateralBalanceInsufficient({ balance: 10n, pull: { kind: 'amount', token: USDC, amount: 10n } }),
    ).toBe(false)
  })

  it('blocks an unpriced pull only when the wallet is empty', () => {
    expect(isOpenCollateralBalanceInsufficient({ balance: 0n, pull: { kind: 'unpriced', token: USDC } })).toBe(true)
    expect(isOpenCollateralBalanceInsufficient({ balance: 1n, pull: { kind: 'unpriced', token: USDC } })).toBe(false)
  })
})
