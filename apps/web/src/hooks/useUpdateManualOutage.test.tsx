import { ApolloError } from '@apollo/client'
import { renderHook } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import { useUpdateManualOutage } from 'hooks/useUpdateManualOutage'
import { Provider } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { ReactNode } from 'react'
import { manualChainOutageAtom } from 'state/outage/atoms'
import { mocked } from 'test-utils/mocked'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/connection/useIsOffline', () => ({
  useIsOffline: vi.fn(),
}))

// Wrapper component for Jotai Provider - creates a fresh scope for each test
function JotaiWrapper({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>
}

// Helper to test hook behavior and read atom value in one render
function useTestHook(props: Parameters<typeof useUpdateManualOutage>[0]) {
  useUpdateManualOutage(props)
  const manualOutage = useAtomValue(manualChainOutageAtom)
  return { manualOutage }
}

describe('useUpdateManualOutage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default to online
    mocked(useIsOffline).mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Behavior', () => {
    it('should not update atom when chainId is undefined', () => {
      const { result } = renderHook(() => useTestHook({ chainId: undefined }), { wrapper: JotaiWrapper })

      expect(result.current.manualOutage).toBeUndefined()
    })

    it('should not update atom when user is offline', () => {
      mocked(useIsOffline).mockReturnValue(true)

      const networkError = new ApolloError({
        networkError: new Error('Network failure'),
      })

      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3: networkError,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toBeUndefined()
    })

    it('should dismiss banner when no errors are present', () => {
      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toBeUndefined()
    })
  })

  describe('Error Detection', () => {
    it('should show banner when V3 network error is detected', () => {
      const networkError = new ApolloError({
        networkError: new Error('Network failure'),
      })

      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3: networkError,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
      })
    })

    it('should show banner with V2 version when V2 network error is detected', () => {
      const networkError = new ApolloError({
        networkError: new Error('Network failure'),
      })

      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV2: networkError,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
        version: GraphQLApi.ProtocolVersion.V2,
      })
    })

    it('should show banner when server error is detected', () => {
      const serverError = new ApolloError({
        graphQLErrors: [
          {
            message: 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          },
        ],
      })

      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3: serverError,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
      })
    })

    it('should not show banner for client errors (4xx)', () => {
      const clientError = new ApolloError({
        networkError: Object.assign(new Error('Bad Request'), { statusCode: 400 }),
      })

      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3: clientError,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toBeUndefined()
    })

    it('should show banner when ExternalAPIError is detected', () => {
      // The Uniswap API returns errorType at the root level of GraphQL errors,
      // not in extensions. We need to cast to bypass TypeScript's strict typing.
      const externalApiError = new ApolloError({
        graphQLErrors: [
          {
            message: 'external API error',
            errorType: 'ExternalAPIError',
          } as { message: string; errorType: string },
        ],
      })

      const { result } = renderHook(
        () =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3: externalApiError,
          }),
        { wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
      })
    })
  })

  describe('Recovery Behavior', () => {
    it('should dismiss banner on success after previous error', () => {
      const networkError = new ApolloError({
        networkError: new Error('Network failure'),
      })

      // Start with error
      const { result, rerender } = renderHook(
        ({ errorV3 }: { errorV3: ApolloError | undefined }) =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3,
          }),
        { initialProps: { errorV3: networkError as ApolloError | undefined }, wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
      })

      // Rerender without error (success)
      rerender({ errorV3: undefined })

      expect(result.current.manualOutage).toBeUndefined()
    })

    it('should resume tracking when coming back online', () => {
      const networkError = new ApolloError({
        networkError: new Error('Network failure'),
      })

      // Start offline
      mocked(useIsOffline).mockReturnValue(true)

      const { rerender, result } = renderHook(
        ({ error }: { error: ApolloError | undefined }) =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3: error,
          }),
        { initialProps: { error: networkError as ApolloError | undefined }, wrapper: JotaiWrapper },
      )

      // Should not show banner while offline
      expect(result.current.manualOutage).toBeUndefined()

      // Come back online
      mocked(useIsOffline).mockReturnValue(false)
      rerender({ error: networkError })

      // Should show banner after coming online
      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
      })
    })
  })

  describe('Trigger Parameter', () => {
    it('should re-evaluate when trigger changes', () => {
      const networkError = new ApolloError({
        networkError: new Error('Network failure'),
      })

      const { result, rerender } = renderHook(
        ({ trigger, errorV3 }: { trigger: number; errorV3: ApolloError | undefined }) =>
          useTestHook({
            chainId: UniverseChainId.Mainnet,
            errorV3,
            trigger,
          }),
        { initialProps: { trigger: 1, errorV3: networkError as ApolloError | undefined }, wrapper: JotaiWrapper },
      )

      expect(result.current.manualOutage).toEqual({
        chainId: UniverseChainId.Mainnet,
      })

      // Change trigger and clear error - should dismiss
      rerender({ trigger: 2, errorV3: undefined })

      expect(result.current.manualOutage).toBeUndefined()
    })
  })
})
