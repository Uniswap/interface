import { orderedTransportUrls } from 'components/Web3Provider/wagmiConfig'

// A minimal type that matches the structure returned by getChainInfo().
type MockChain = {
  rpcUrls: {
    interface?: { http?: (string | undefined)[] }
    default?: { http?: (string | undefined)[] }
    public?: { http?: (string | undefined)[] }
    fallback?: { http?: (string | undefined)[] }
  }
}

describe('orderedTransportUrls', () => {
  it('returns URLs in correct order (interface > default > public > fallback) & removes duplicates', () => {
    const chain: MockChain = {
      rpcUrls: {
        interface: { http: ['https://main1.com', 'https://main2.com'] },
        default: { http: ['https://main2.com'] },
        public: { http: ['https://public.com'] },
        fallback: { http: ['https://fallback1.com', 'https://main1.com'] },
      },
    }

    const result = orderedTransportUrls(chain as any)
    // Explanation of expected behavior:
    // 1. interface: main1, main2
    // 2. default:   main2 (duplicate, skip)
    // 3. public:    public.com
    // 4. fallback:  fallback1, main1 (duplicate, skip)
    //
    // => final array: [main1, main2, public, fallback1]
    expect(result).toHaveLength(4)
    expect(result).toEqual(['https://main1.com', 'https://main2.com', 'https://public.com', 'https://fallback1.com'])
  })

  it('filters out undefined or empty strings', () => {
    const chain: MockChain = {
      rpcUrls: {
        interface: { http: ['https://interface.com', '', undefined] },
        default: { http: [undefined, ''] },
        public: { http: [] },
        fallback: { http: ['https://fallback.com'] },
      },
    }

    const result = orderedTransportUrls(chain as any)
    // Should remove empty/undefined entries
    expect(result).toEqual(['https://interface.com', 'https://fallback.com'])
  })

  it('handles scenario where some keys are missing', () => {
    const chain: MockChain = {
      rpcUrls: {
        // interface is missing
        default: { http: ['https://default.com'] },
        // public is missing
        fallback: { http: ['https://fallback.com'] },
      },
    }

    const result = orderedTransportUrls(chain as any)
    // Should gather from default, then fallback
    expect(result).toEqual(['https://default.com', 'https://fallback.com'])
  })

  it('returns empty array if everything is empty/undefined', () => {
    const chain: MockChain = {
      rpcUrls: {
        interface: { http: [] },
        default: { http: [] },
        public: { http: [] },
        fallback: { http: [] },
      },
    }

    const result = orderedTransportUrls(chain as any)
    expect(result).toEqual([])
  })

  it('deduplicates URLs across arrays', () => {
    const chain: MockChain = {
      rpcUrls: {
        interface: { http: ['https://common.com'] },
        default: { http: ['https://common.com'] },
        public: { http: ['https://common.com'] },
        fallback: { http: ['https://common.com'] },
      },
    }

    const result = orderedTransportUrls(chain as any)
    // All four arrays have the same URL => only one unique entry
    expect(result).toHaveLength(1)
    expect(result).toEqual(['https://common.com'])
  })
})
