import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { UserRejectedRequestError } from '~/chains'
import { useSelectChain } from '~/hooks/useSelectChain'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

const mocks = vi.hoisted(() => ({ switchChain: vi.fn() }))

vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useSwitchChain: () => ({ switchChain: mocks.switchChain }),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ chainId: UniverseChainId.Base, connector: { name: 'Injected' } }),
}))

vi.mock('uniswap/src/features/chains/hooks/useSupportedChainId', () => ({
  useIsSupportedChainIdCallback: () => () => true,
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

type SwitchChainCallbacks = { onSettled: (data: unknown, error: unknown) => void }

function selectChain(): Promise<boolean> {
  const { result } = renderHook(() => useSelectChain())
  return result.current(UniverseChainId.Mainnet)
}

// Liquidity confirm stays disabled until its saga ends, so a switch prompt the wallet never settles must
// still resolve here rather than blocking the saga.
describe('useSelectChain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves true when the wallet switches', async () => {
    mocks.switchChain.mockImplementation((_args: unknown, { onSettled }: SwitchChainCallbacks) => onSettled({}, null))

    await expect(selectChain()).resolves.toBe(true)
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('resolves false without a failure popup when the user rejects the switch', async () => {
    mocks.switchChain.mockImplementation((_args: unknown, { onSettled }: SwitchChainCallbacks) =>
      onSettled(undefined, new UserRejectedRequestError(new Error('User rejected the request'))),
    )

    await expect(selectChain()).resolves.toBe(false)
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('resolves false after 60 seconds when the wallet never settles the switch request', async () => {
    vi.useFakeTimers()
    mocks.switchChain.mockImplementation(() => undefined)

    let settled: boolean | undefined
    const pending = selectChain().then((value) => {
      settled = value
      return value
    })

    await vi.advanceTimersByTimeAsync(59_999)
    expect(settled).toBeUndefined()

    await vi.advanceTimersByTimeAsync(1)
    await expect(pending).resolves.toBe(false)
    expect(popupRegistry.addPopup).toHaveBeenCalledWith(
      { failedSwitchNetwork: UniverseChainId.Mainnet, type: PopupType.FailedSwitchNetwork },
      'failed-network-switch',
    )
  })
})
