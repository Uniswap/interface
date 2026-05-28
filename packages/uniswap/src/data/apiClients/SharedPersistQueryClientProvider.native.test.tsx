import { useIsRestoring } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react'
import type { AppStateStatus } from 'react-native'

const { mockRestore, mockSave, mockRemove, mockWarn, handlerRef } = vi.hoisted(() => ({
  mockRestore: vi.fn().mockResolvedValue(undefined),
  mockSave: vi.fn().mockResolvedValue(undefined),
  mockRemove: vi.fn(),
  mockWarn: vi.fn(),
  handlerRef: { current: undefined as ((state: AppStateStatus) => void) | undefined },
}))

vi.mock('@tanstack/react-query-persist-client', () => ({
  persistQueryClientRestore: (...args: unknown[]) => mockRestore(...args),
  persistQueryClientSave: (...args: unknown[]) => mockSave(...args),
}))

vi.mock('uniswap/src/data/apiClients/createPersister', () => ({
  createPersister: () => ({}),
}))

vi.mock('@universe/api', async () => {
  const { QueryClient } = await import('@tanstack/react-query')
  return { SharedQueryClient: new QueryClient() }
})

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    AppState: {
      ...actual.AppState,
      addEventListener: (event: string, handler: (state: AppStateStatus) => void) => {
        if (event === 'change') {
          handlerRef.current = handler
        }
        return { remove: mockRemove }
      },
    },
  }
})

vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: mockWarn },
}))

// Importing the module under test triggers `persistQueryClientRestore()` once at
// module load — so we capture that call record before any `mockClear()` runs.
import { SharedPersistQueryClientProvider } from 'uniswap/src/data/apiClients/SharedPersistQueryClientProvider.native'

const moduleLoadRestoreCalls = mockRestore.mock.calls.slice()

describe('SharedPersistQueryClientProvider.native', () => {
  beforeEach(() => {
    mockSave.mockClear()
    mockSave.mockResolvedValue(undefined)
    mockRemove.mockClear()
    mockWarn.mockClear()
    handlerRef.current = undefined
  })

  it('calls persistQueryClientRestore once at module load with the expected buster', () => {
    expect(moduleLoadRestoreCalls).toHaveLength(1)
    expect(moduleLoadRestoreCalls[0]?.[0]).toMatchObject({ buster: 'v1' })
  })

  it('renders children', async () => {
    const { findByTestId } = render(
      <SharedPersistQueryClientProvider>
        <span data-testid="child">child</span>
      </SharedPersistQueryClientProvider>,
    )
    expect(await findByTestId('child')).toBeDefined()
  })

  it('exposes isRestoring=false to children once restore settles', async () => {
    function Probe(): JSX.Element {
      const isRestoring = useIsRestoring()
      return <span data-testid="restoring">{String(isRestoring)}</span>
    }

    const { getByTestId } = render(
      <SharedPersistQueryClientProvider>
        <Probe />
      </SharedPersistQueryClientProvider>,
    )

    await waitFor(() => {
      expect(getByTestId('restoring').textContent).toBe('false')
    })
  })

  it('persists when AppState transitions to background', async () => {
    render(
      <SharedPersistQueryClientProvider>
        <span />
      </SharedPersistQueryClientProvider>,
    )
    await act(async () => {
      handlerRef.current?.('background')
    })
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    expect(mockSave.mock.calls[0]?.[0]).toMatchObject({ buster: 'v1' })
  })

  it('persists when AppState transitions to inactive', async () => {
    render(
      <SharedPersistQueryClientProvider>
        <span />
      </SharedPersistQueryClientProvider>,
    )
    await act(async () => {
      handlerRef.current?.('inactive')
    })
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
  })

  it('does not persist when AppState transitions to active', async () => {
    render(
      <SharedPersistQueryClientProvider>
        <span />
      </SharedPersistQueryClientProvider>,
    )
    await act(async () => {
      handlerRef.current?.('active')
    })
    // Flush any pending microtasks so a stray save would have a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('logs but does not throw when persistQueryClientSave rejects', async () => {
    mockSave.mockRejectedValueOnce(new Error('mmkv write failed'))
    render(
      <SharedPersistQueryClientProvider>
        <span />
      </SharedPersistQueryClientProvider>,
    )
    await act(async () => {
      handlerRef.current?.('background')
    })
    await waitFor(() => expect(mockWarn).toHaveBeenCalledTimes(1))
    const [file, action] = mockWarn.mock.calls[0] ?? []
    expect(file).toBe('SharedPersistQueryClientProvider.native')
    expect(action).toBe('save')
  })

  it('removes the AppState listener on unmount', () => {
    const { unmount } = render(
      <SharedPersistQueryClientProvider>
        <span />
      </SharedPersistQueryClientProvider>,
    )
    unmount()
    expect(mockRemove).toHaveBeenCalledTimes(1)
  })
})
