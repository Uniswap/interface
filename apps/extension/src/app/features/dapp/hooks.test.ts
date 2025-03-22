import {
  useDappConnectedAccounts,
  useDappInfo,
  useDappLastChainId,
  useDappStateUpdated,
} from 'src/app/features/dapp/hooks'
import { DappState, dappStore } from 'src/app/features/dapp/store'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_3 } from 'uniswap/src/test/fixtures'
import { ACCOUNT, ACCOUNT2, ACCOUNT3 } from 'wallet/src/test/fixtures'

const SAMPLE_DAPP = 'http://example.com'
const SAMPLE_DAPP_2 = 'http://uniswap.org'

const dappState: DappState = {
  [SAMPLE_DAPP]: {
    lastChainId: UniverseChainId.ArbitrumOne,
    connectedAccounts: [ACCOUNT, ACCOUNT2],
    activeConnectedAddress: SAMPLE_SEED_ADDRESS_1,
  },
  [SAMPLE_DAPP_2]: {
    lastChainId: UniverseChainId.Base,
    connectedAccounts: [ACCOUNT, ACCOUNT3],
    activeConnectedAddress: SAMPLE_SEED_ADDRESS_3,
  },
}

const mockAddListener = jest.fn()
const mockGet = jest.fn(() => {
  return Promise.resolve({ dappState })
})
Object.defineProperty(global, 'chrome', {
  value: {
    runtime: { lastError: undefined },
    storage: {
      local: {
        get: mockGet,
        set: jest.fn(),
        onChanged: {
          addListener: mockAddListener,
        },
      },
    },
  },
})

describe('Dapp hooks', () => {
  let onChangeListener: (changes: { dappState: chrome.storage.StorageChange }) => void
  beforeAll(async () => {
    await dappStore.init()
    onChangeListener = mockAddListener.mock.calls[0][0]
  })

  it('useDappStateUpdated should update state when chrome storage changes', () => {
    const { result } = renderHook(() => useDappStateUpdated())
    expect(result.current).toBe(false)
    act(() => {
      onChangeListener({ dappState: { newValue: dappState } })
    })
    expect(result.current).toBe(true)
  })

  it('useDappInfo should return undefined when dappUrl is undefined', async () => {
    const { result } = renderHook(() => useDappInfo(undefined))
    await waitFor(() => expect(result.current).toBeUndefined())
  })

  it('useDappInfo should return DappInfo when dappUrl is defined', async () => {
    const { result } = renderHook(() => useDappInfo(SAMPLE_DAPP))
    await waitFor(() =>
      expect(result.current).toEqual({
        lastChainId: UniverseChainId.ArbitrumOne,
        connectedAccounts: [ACCOUNT, ACCOUNT2],
        activeConnectedAddress: SAMPLE_SEED_ADDRESS_1,
      }),
    )
  })

  it('useDappLastChainId should return undefined when dappUrl is undefined', async () => {
    const { result } = renderHook(() => useDappLastChainId(undefined))
    await waitFor(() => expect(result.current).toBeUndefined())
  })

  it('useDappLastChainId should return lastChainId when dappUrl is defined', async () => {
    const { result } = renderHook(() => useDappLastChainId(SAMPLE_DAPP_2))
    await waitFor(() => expect(result.current).toBe(UniverseChainId.Base))
  })

  it('useDappConnectedAccounts should return empty array when dappUrl is undefined', async () => {
    const { result } = renderHook(() => useDappConnectedAccounts(undefined))
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('useDappConnectedAccounts should return connected accounts when dappUrl is defined', async () => {
    const { result } = renderHook(() => useDappConnectedAccounts(SAMPLE_DAPP))
    await waitFor(() => expect(result.current).toEqual([ACCOUNT, ACCOUNT2]))
  })
})
