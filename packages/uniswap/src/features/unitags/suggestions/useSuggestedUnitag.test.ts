import { SharedQueryClient } from '@universe/api'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { generateUnitagCandidate } from 'uniswap/src/features/unitags/suggestions/generateUnitagSuggestion'
import { useSuggestedUnitag } from 'uniswap/src/features/unitags/suggestions/useSuggestedUnitag'
import { act, renderHook, waitFor } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/unitags/suggestions/generateUnitagSuggestion', () => ({
  generateUnitagCandidate: vi.fn(),
  appendRandomDigits: vi.fn((base: string) => base),
}))

vi.mock('uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient', () => ({
  unitagsApiClient: {
    fetchUsername: vi.fn(),
  },
}))

const generateMock = generateUnitagCandidate as Mock
const fetchUsernameMock = unitagsApiClient.fetchUsername as Mock

// Returns the provided names in order, then repeats the last one so the generator never runs dry.
function sequentialNames(names: string[]): () => string {
  let i = 0
  return () => names[Math.min(i++, names.length - 1)] as string
}

describe('useSuggestedUnitag', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
  })

  it('initializes with the first available suggestion', async () => {
    generateMock.mockImplementation(sequentialNames(['alpha', 'bravo', 'charlie', 'delta', 'echo']))
    fetchUsernameMock.mockResolvedValue({ available: true })

    const { result } = renderHook(() => useSuggestedUnitag())

    await waitFor(() => expect(result.current.isInitializing).toBe(false))
    expect(result.current.suggestion).toBe('alpha')
  })

  it('skips taken names and suggests the first available one', async () => {
    generateMock.mockImplementation(sequentialNames(['alpha', 'bravo', 'charlie', 'delta', 'echo']))
    fetchUsernameMock.mockImplementation(({ username }: { username: string }) =>
      Promise.resolve({ available: username !== 'alpha' }),
    )

    const { result } = renderHook(() => useSuggestedUnitag())

    await waitFor(() => expect(result.current.suggestion).toBe('bravo'))
  })

  it('shuffle replaces the suggestion with a different available name', async () => {
    generateMock.mockImplementation(sequentialNames(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']))
    fetchUsernameMock.mockResolvedValue({ available: true })

    const { result } = renderHook(() => useSuggestedUnitag())
    await waitFor(() => expect(result.current.suggestion).toBe('alpha'))

    await act(async () => {
      result.current.shuffle()
    })

    await waitFor(() => {
      expect(result.current.suggestion).toBeDefined()
      expect(result.current.suggestion).not.toBe('alpha')
    })
  })

  it('falls back to an optimistic suggestion when availability cannot be determined', async () => {
    generateMock.mockImplementation(sequentialNames(['alpha', 'bravo', 'charlie']))
    fetchUsernameMock.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useSuggestedUnitag())

    await waitFor(() => expect(result.current.isInitializing).toBe(false))
    expect(result.current.suggestion).toBe('alpha')
  })

  it('gives up cleanly when every candidate is taken', async () => {
    generateMock.mockImplementation(
      sequentialNames(['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel']),
    )
    fetchUsernameMock.mockResolvedValue({ available: false })

    const { result } = renderHook(() => useSuggestedUnitag())

    // Probing is bounded, so initialization completes without a suggestion instead of spinning.
    await waitFor(() => expect(result.current.isInitializing).toBe(false))
    expect(result.current.suggestion).toBeUndefined()
    expect(result.current.isShuffling).toBe(false)
  })

  it('ignores a late shuffle result after unmount', async () => {
    generateMock.mockImplementation(sequentialNames(['alpha', 'bravo', 'charlie', 'delta', 'echo']))
    const pending: Array<(value: { available: boolean }) => void> = []
    fetchUsernameMock.mockImplementation(({ username }: { username: string }) => {
      if (username === 'alpha') {
        return Promise.resolve({ available: true })
      }
      // Hang every later probe so the vetted queue stays empty and shuffle takes the slow path.
      return new Promise((resolve) => pending.push(resolve))
    })

    const { result, unmount } = renderHook(() => useSuggestedUnitag())
    await waitFor(() => expect(result.current.suggestion).toBe('alpha'))

    act(() => {
      result.current.shuffle()
    })
    expect(result.current.isShuffling).toBe(true)

    const callsBeforeUnmount = fetchUsernameMock.mock.calls.length
    unmount()

    await act(async () => {
      pending.forEach((resolve) => resolve({ available: true }))
    })
    await act(async () => {})

    // Late results after unmount must not spawn further probes (refill loops stop when cancelled).
    expect(fetchUsernameMock.mock.calls.length).toBe(callsBeforeUnmount)
  })
})
