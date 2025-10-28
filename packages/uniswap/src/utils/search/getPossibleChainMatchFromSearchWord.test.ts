import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPossibleChainMatchFromSearchWord } from 'uniswap/src/utils/search/getPossibleChainMatchFromSearchWord'

// Mock the dependencies before importing the function
jest.mock('uniswap/src/features/chains/chainInfo', () => ({
  getChainInfo: jest.fn(),
}))

jest.mock('uniswap/src/features/chains/utils', () => ({
  isTestnetChain: jest.fn(),
}))

// Import the mocked functions
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'

const mockGetChainInfo = getChainInfo as any
const mockIsTestnetChain = isTestnetChain as any

describe('getPossibleChainMatchFromSearchWord', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when search word is empty or invalid', () => {
    it('should return undefined when search word is empty string', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      const result = getPossibleChainMatchFromSearchWord('', enabledChains)

      expect(result).toBeUndefined()
    })

    it('should return undefined when search word is null', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      const result = getPossibleChainMatchFromSearchWord(null as any, enabledChains)

      expect(result).toBeUndefined()
    })

    it('should return undefined when search word is undefined', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      const result = getPossibleChainMatchFromSearchWord(undefined as any, enabledChains)

      expect(result).toBeUndefined()
    })

    it('should return undefined when search word is only whitespace', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      // Mock the functions to return proper structure
      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('   ', enabledChains)

      expect(result).toBeUndefined()
    })
  })

  describe('when matching by native currency name', () => {
    it('should match exact native currency name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
    })

    it('should be case insensitive for native currency name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ETHEREUM', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
    })
  })

  describe('when matching by interface name', () => {
    it('should match exact interface name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('mainnet', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
    })

    it('should be case insensitive for interface name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('MAINNET', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
    })

    it('should match polygon interface name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('polygon', enabledChains)

      expect(result).toBe(UniverseChainId.Polygon)
    })

    it('should match arbitrum interface name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.ArbitrumOne) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'arbitrum',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('arbitrum', enabledChains)

      expect(result).toBe(UniverseChainId.ArbitrumOne)
    })
  })

  describe('when handling testnet chains', () => {
    it('should skip testnet chains', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Sepolia]

      mockIsTestnetChain.mockImplementation((chainId: UniverseChainId) => chainId === UniverseChainId.Sepolia)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Sepolia) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'sepolia',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
      expect(mockIsTestnetChain).toHaveBeenCalledWith(UniverseChainId.Mainnet)
      // The function returns early when it finds a match, so it doesn't check Sepolia
      // This is the correct behavior - it should return the first non-testnet match
    })

    it('should return undefined when only testnet chains match', () => {
      const enabledChains = [UniverseChainId.Sepolia]

      mockIsTestnetChain.mockReturnValue(true)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Sepolia) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'sepolia',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBeUndefined()
    })
  })

  describe('when no matches are found', () => {
    it('should return undefined when no chains match', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Polygon' },
            interfaceName: 'polygon',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('bitcoin', enabledChains)

      expect(result).toBeUndefined()
    })

    it('should return undefined when enabledChains is empty', () => {
      const enabledChains: UniverseChainId[] = []

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBeUndefined()
    })

    it('should return undefined when all chains are testnets', () => {
      const enabledChains = [UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia]

      mockIsTestnetChain.mockReturnValue(true)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Sepolia) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'sepolia',
          } as any
        }
        if (chainId === UniverseChainId.UnichainSepolia) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'unichain-sepolia',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBeUndefined()
    })
  })

  describe('when multiple chains could match', () => {
    it('should return the first matching chain', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Polygon, UniverseChainId.ArbitrumOne]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Polygon) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'polygon',
          } as any
        }
        if (chainId === UniverseChainId.ArbitrumOne) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'arbitrum',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
    })
  })

  describe('edge cases', () => {
    it('should handle native currency names with empty first word', () => {
      const enabledChains = [UniverseChainId.Mainnet]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: ' Ethereum' }, // Leading space
            interfaceName: 'mainnet',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('ethereum', enabledChains)

      expect(result).toBeUndefined()
    })

    it('should handle interface names with special characters', () => {
      const enabledChains = [UniverseChainId.Mainnet]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'main-net', // With hyphen
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('main-net', enabledChains)

      expect(result).toBe(UniverseChainId.Mainnet)
    })

    it('should match base chain interface name', () => {
      const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Base]

      mockIsTestnetChain.mockReturnValue(false)
      mockGetChainInfo.mockImplementation((chainId: UniverseChainId) => {
        if (chainId === UniverseChainId.Mainnet) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'mainnet',
          } as any
        }
        if (chainId === UniverseChainId.Base) {
          return {
            nativeCurrency: { name: 'Ethereum' },
            interfaceName: 'base',
          } as any
        }
        return {} as any
      })

      const result = getPossibleChainMatchFromSearchWord('base', enabledChains)

      expect(result).toBe(UniverseChainId.Base)
    })
  })
})
