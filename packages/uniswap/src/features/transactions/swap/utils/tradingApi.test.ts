import { TradingApi } from '@universe/api'
import { useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { useProtocolsForChain } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { useQuoteRoutingParams } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})
vi.mock('uniswap/src/features/transactions/swap/utils/protocols', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/transactions/swap/utils/protocols')>()
  return {
    ...actual,
    useProtocolsForChain: vi.fn((protocols) => protocols),
  }
})

const mockUseFeatureFlag = useFeatureFlag as Mock
const mockUseProtocolsForChain = useProtocolsForChain as Mock

describe('useQuoteRoutingParams', () => {
  const tokenInChainId = UniverseChainId.Mainnet
  const tokenOutChainId = UniverseChainId.Mainnet
  const defaultProtocols: FrontendSupportedProtocol[] = [
    TradingApi.ProtocolItems.V2,
    TradingApi.ProtocolItems.V3,
    TradingApi.ProtocolItems.V4,
  ]

  beforeEach(() => {
    // Reset mocks before each test
    mockUseFeatureFlag.mockClear()
    mockUseProtocolsForChain.mockImplementation((protocols) => protocols) // Reset to default mock behavior
  })

  it('should return only V2, V3, V4 protocols for USD quotes and no hooksOptions', () => {
    const { result } = renderHook(() =>
      useQuoteRoutingParams({
        selectedProtocols: defaultProtocols,
        tokenInChainId,
        tokenOutChainId,
        isUSDQuote: true,
        isV4HookPoolsEnabled: true,
      }),
    )
    expect(result.current).toEqual({
      protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V4],
    })
  })

  it('should return BEST_PRICE routingPreference for bridging quotes', () => {
    const { result } = renderHook(() =>
      useQuoteRoutingParams({
        selectedProtocols: defaultProtocols,
        tokenInChainId: UniverseChainId.Mainnet,
        tokenOutChainId: UniverseChainId.ArbitrumOne,
        isV4HookPoolsEnabled: true,
      }),
    )
    expect(result.current).toEqual({
      hooksOptions: TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE,
      protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V4],
    })
  })

  describe('when V4 Hooks are enabled', () => {
    describe('and isV4HookPoolsEnabled is true', () => {
      const isV4HookPoolsEnabled = true

      it('should return V4_HOOKS_INCLUSIVE for hooksOptions if V4 is already in protocols', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
          TradingApi.ProtocolItems.V4,
        ]
        // eslint-disable-next-line max-nested-callbacks
        mockUseProtocolsForChain.mockImplementation(() => selectedProtocols)

        // eslint-disable-next-line max-nested-callbacks
        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocolsForChain).toHaveBeenCalledWith(selectedProtocols, tokenInChainId)
        expect(result.current).toEqual({
          protocols: selectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE,
        })
      })

      it('should add V4 to protocols and return V4_HOOKS_ONLY for hooksOptions if V4 is not in protocols', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
        ]
        const expectedProtocols = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
          TradingApi.ProtocolItems.V4,
        ]
        // eslint-disable-next-line max-nested-callbacks
        mockUseProtocolsForChain.mockImplementation(() => selectedProtocols) // Original protocols without V4

        // eslint-disable-next-line max-nested-callbacks
        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocolsForChain).toHaveBeenCalledWith(selectedProtocols, tokenInChainId)
        expect(result.current).toEqual({
          protocols: expectedProtocols, // V4 is added
          hooksOptions: TradingApi.HooksOptions.V4_HOOKS_ONLY,
        })
      })
    })

    describe('and isV4HookPoolsEnabled is false', () => {
      const isV4HookPoolsEnabled = false

      it('should return the original protocols and V4_NO_HOOKS for hooksOptions', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
          TradingApi.ProtocolItems.V4,
        ]
        // eslint-disable-next-line max-nested-callbacks
        mockUseProtocolsForChain.mockImplementation(() => selectedProtocols)

        // eslint-disable-next-line max-nested-callbacks
        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocolsForChain).toHaveBeenCalledWith(selectedProtocols, tokenInChainId)
        expect(result.current).toEqual({
          protocols: selectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_NO_HOOKS,
        })
      })

      it('should return the original protocols (without V4) and V4_NO_HOOKS for hooksOptions', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
        ]
        // eslint-disable-next-line max-nested-callbacks
        mockUseProtocolsForChain.mockImplementation(() => selectedProtocols)

        // eslint-disable-next-line max-nested-callbacks
        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocolsForChain).toHaveBeenCalledWith(selectedProtocols, tokenInChainId)
        expect(result.current).toEqual({
          protocols: selectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_NO_HOOKS,
        })
      })
    })
  })
})
