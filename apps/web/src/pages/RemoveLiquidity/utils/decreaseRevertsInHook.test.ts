import { decreaseRevertsInHook, isHookRevert } from '~/pages/RemoveLiquidity/utils/decreaseRevertsInHook'
import { REMOVE_LIQUIDITY_HOOK, REMOVE_LIQUIDITY_HOOK_REVERT_DATA } from '~/test-utils/pools/hookRevertFixtures'

const { mockCall } = vi.hoisted(() => ({ mockCall: vi.fn() }))

vi.mock('~/constants/providers', () => ({
  getInterfaceProvider: vi.fn(() => ({ call: mockCall })),
}))

const TX = {
  chainId: 8453,
  from: '0x14A20392A1d61Cd6f29013a1A02b61E0Fcd98DD1',
  to: '0x7C5f5A4bBd8fD63184577525326123B519429bDc',
  data: '0xdd46508f',
  value: '0x00',
}
const OTHER_HOOK = '0x0000000000000000000000000000000000000a00'

describe('isHookRevert', () => {
  it('attributes a WrappedError to the hook it names', () => {
    expect(isHookRevert(REMOVE_LIQUIDITY_HOOK_REVERT_DATA, REMOVE_LIQUIDITY_HOOK)).toBe(true)
    expect(isHookRevert(REMOVE_LIQUIDITY_HOOK_REVERT_DATA, REMOVE_LIQUIDITY_HOOK.toLowerCase())).toBe(true)
  })

  it('does not attribute it to another hook', () => {
    expect(isHookRevert(REMOVE_LIQUIDITY_HOOK_REVERT_DATA, OTHER_HOOK)).toBe(false)
  })

  it('ignores a successful call and other reverts', () => {
    expect(isHookRevert('0x', REMOVE_LIQUIDITY_HOOK)).toBe(false)
    // DeadlinePassed(uint256): a revert, but not the hook's.
    expect(isHookRevert(`0xbfb22adf${'0'.repeat(64)}`, REMOVE_LIQUIDITY_HOOK)).toBe(false)
    expect(isHookRevert(undefined, REMOVE_LIQUIDITY_HOOK)).toBe(false)
  })
})

describe('decreaseRevertsInHook', () => {
  beforeEach(() => {
    mockCall.mockReset()
  })

  it('is true when the eth_call resolves with the hook revert, as ethers v5 does', async () => {
    mockCall.mockResolvedValue(REMOVE_LIQUIDITY_HOOK_REVERT_DATA)
    await expect(decreaseRevertsInHook({ tx: TX, hookAddress: REMOVE_LIQUIDITY_HOOK })).resolves.toBe(true)
    expect(mockCall).toHaveBeenCalledWith({ from: TX.from, to: TX.to, data: TX.data, value: TX.value })
  })

  it('is true when the provider rejects with the revert data nested in the error', async () => {
    mockCall.mockRejectedValue({
      code: 'CALL_EXCEPTION',
      error: { code: 3, message: 'execution reverted', data: REMOVE_LIQUIDITY_HOOK_REVERT_DATA },
    })
    await expect(decreaseRevertsInHook({ tx: TX, hookAddress: REMOVE_LIQUIDITY_HOOK })).resolves.toBe(true)
  })

  it('is false when the RPC is unavailable', async () => {
    mockCall.mockRejectedValue(new Error('401 Unauthorized'))
    await expect(decreaseRevertsInHook({ tx: TX, hookAddress: REMOVE_LIQUIDITY_HOOK })).resolves.toBe(false)
  })

  it('is false when the call succeeds', async () => {
    mockCall.mockResolvedValue('0x')
    await expect(decreaseRevertsInHook({ tx: TX, hookAddress: REMOVE_LIQUIDITY_HOOK })).resolves.toBe(false)
  })
})
