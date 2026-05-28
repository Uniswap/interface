import { waitFor } from '@testing-library/react-native'
import { BlockaidApiClient } from 'uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient'
import { useBlockaidVerification } from 'wallet/src/features/dappRequests/hooks/useBlockaidVerification'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'
import { renderHook } from 'wallet/src/test/test-utils'

jest.mock('uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient', () => ({
  BlockaidApiClient: {
    scanSite: jest.fn(),
  },
}))

const mockScanSite = BlockaidApiClient.scanSite as jest.MockedFunction<typeof BlockaidApiClient.scanSite>

describe('useBlockaidVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementation to ensure clean state
    mockScanSite.mockReset()
  })

  describe('Query configuration', () => {
    it('should call BlockaidApiClient.scanSite with the provided URL', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)
      const testUrl = 'https://example.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockScanSite).toHaveBeenCalledWith(testUrl)
      expect(mockScanSite).toHaveBeenCalledTimes(1)
    })

    it('should not retry on failure', async () => {
      mockScanSite.mockRejectedValue(new Error('API error'))
      const testUrl = 'https://failure-test-example.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 3000 },
      )

      // Should only be called once since retry is disabled
      expect(mockScanSite).toHaveBeenCalledTimes(1)
    })
  })

  describe('Verification status handling', () => {
    it('should return Verified status when dapp is verified', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)
      const testUrl = 'https://safe-dapp.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Verified)
    })

    it('should return Unverified status when dapp is not verified', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Unverified)
      const testUrl = 'https://unknown-dapp.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Unverified)
    })

    it('should return Threat status when dapp is malicious', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Threat)
      const testUrl = 'https://malicious-dapp.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Threat)
    })
  })

  describe('Loading state', () => {
    it('should set isLoading to false after successful verification', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)
      const testUrl = 'https://loading-success-test.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Verified)
    })

    it('should set isLoading to false after failed verification', async () => {
      mockScanSite.mockRejectedValue(new Error('Network error'))
      const testUrl = 'https://loading-failure-test.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockScanSite.mockRejectedValue(new Error('API error'))
      const testUrl = 'https://api-error-test.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBeUndefined()
    })

    it('should handle network errors gracefully', async () => {
      mockScanSite.mockRejectedValue(new Error('Network error'))
      const testUrl = 'https://network-error-test.com'

      const { result } = renderHook(() => useBlockaidVerification(testUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBeUndefined()
    })
  })

  describe('Caching behavior', () => {
    it('should make separate requests for different URLs', async () => {
      mockScanSite
        .mockResolvedValueOnce(DappVerificationStatus.Verified)
        .mockResolvedValueOnce(DappVerificationStatus.Threat)

      // First URL
      const { result: result1 } = renderHook(() => useBlockaidVerification('https://example1.com'))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(result1.current.verificationStatus).toBe(DappVerificationStatus.Verified)

      // Second URL
      const { result: result2 } = renderHook(() => useBlockaidVerification('https://example2.com'))

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      expect(result2.current.verificationStatus).toBe(DappVerificationStatus.Threat)
      expect(mockScanSite).toHaveBeenCalledTimes(2)
      expect(mockScanSite).toHaveBeenNthCalledWith(1, 'https://example1.com')
      expect(mockScanSite).toHaveBeenNthCalledWith(2, 'https://example2.com')
    })
  })

  describe('URL variations', () => {
    it('should handle URLs with paths and query parameters', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)
      const complexUrl = 'https://example.com/path?param=value'

      const { result } = renderHook(() => useBlockaidVerification(complexUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Verified)
      expect(mockScanSite).toHaveBeenCalledWith(complexUrl)
    })

    it('should handle URLs with subdomains', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)
      const subdomainUrl = 'https://app.example.com'

      const { result } = renderHook(() => useBlockaidVerification(subdomainUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Verified)
      expect(mockScanSite).toHaveBeenCalledWith(subdomainUrl)
    })

    it('should handle HTTP URLs', async () => {
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)
      const httpUrl = 'http://example.com'

      const { result } = renderHook(() => useBlockaidVerification(httpUrl))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.verificationStatus).toBe(DappVerificationStatus.Verified)
      expect(mockScanSite).toHaveBeenCalledWith(httpUrl)
    })
  })

  describe('Hook reactivity', () => {
    it('should handle different URLs independently', async () => {
      // Test that the hook can handle different URLs in separate instances
      mockScanSite.mockResolvedValue(DappVerificationStatus.Verified)

      const { result: result1 } = renderHook(() => useBlockaidVerification('https://site1.com'))
      const { result: result2 } = renderHook(() => useBlockaidVerification('https://site2.com'))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
        expect(result2.current.isLoading).toBe(false)
      })

      expect(result1.current.verificationStatus).toBe(DappVerificationStatus.Verified)
      expect(result2.current.verificationStatus).toBe(DappVerificationStatus.Verified)
      expect(mockScanSite).toHaveBeenCalledWith('https://site1.com')
      expect(mockScanSite).toHaveBeenCalledWith('https://site2.com')
    })
  })
})
