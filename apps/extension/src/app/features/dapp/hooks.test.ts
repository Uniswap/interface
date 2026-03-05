import {
  useAllDappConnectionsForAccount,
  useDappConnectedAccounts,
  useDappInfo,
  useDappLastChainId,
  useDappStateUpdated,
} from 'src/app/features/dapp/hooks'
import { DappState, dappStore } from 'src/app/features/dapp/store'
import { act, renderHook, waitFor } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_3 } from 'uniswap/src/test/fixtures'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'
import { ACCOUNT, ACCOUNT2, ACCOUNT3 } from 'wallet/src/test/fixtures'

jest.mock('wallet/src/features/wallet/hooks', () => ({
  ...jest.requireActual('wallet/src/features/wallet/hooks'),
  useActiveAccountAddress: jest.fn(),
}))

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

  describe('useAllDappConnectionsForAccount', () => {
    it('should return connections for a specific address when provided', async () => {
      // ACCOUNT2 (SAMPLE_SEED_ADDRESS_2) is only connected to SAMPLE_DAPP
      const { result } = renderHook(() => useAllDappConnectionsForAccount(ACCOUNT2.address))
      await waitFor(() => expect(result.current).toEqual([SAMPLE_DAPP]))
    })

    it('should return connections for address connected to multiple dapps', async () => {
      // ACCOUNT (SAMPLE_SEED_ADDRESS_1) is connected to both dapps
      const { result } = renderHook(() => useAllDappConnectionsForAccount(ACCOUNT.address))
      await waitFor(() => expect(result.current).toEqual(expect.arrayContaining([SAMPLE_DAPP, SAMPLE_DAPP_2])))
      await waitFor(() => expect(result.current).toHaveLength(2))
    })

    it('should return empty array when address has no connections', async () => {
      const unconnectedAddress = '0x0000000000000000000000000000000000000000'
      const { result } = renderHook(() => useAllDappConnectionsForAccount(unconnectedAddress))
      await waitFor(() => expect(result.current).toEqual([]))
    })

    it('should use active account when no address is provided', async () => {
      // Mock useActiveAccountAddress to return ACCOUNT3's address
      jest.mocked(useActiveAccountAddress).mockReturnValue(ACCOUNT3.address)

      // ACCOUNT3 (SAMPLE_SEED_ADDRESS_3) is only connected to SAMPLE_DAPP_2
      const { result } = renderHook(() => useAllDappConnectionsForAccount())
      await waitFor(() => expect(result.current).toEqual([SAMPLE_DAPP_2]))
    })

    it('should return empty array when no address provided and no active account', async () => {
      jest.mocked(useActiveAccountAddress).mockReturnValue(null)

      const { result } = renderHook(() => useAllDappConnectionsForAccount())
      await waitFor(() => expect(result.current).toEqual([]))
    })
  })
})
