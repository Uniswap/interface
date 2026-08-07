import { Actions, URVersion, V4BaseActionsParser } from '@uniswap/v4-sdk'
import { TradingApi } from '@universe/api'
import { EthSendTransactionRPCActions } from 'src/app/features/dappRequests/types/DappRequestTypes'
import getCalldataInfoFromTransaction from 'src/background/utils/getCalldataInfoFromTransaction'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// The CommandParser fallback must not absorb the V4 swap detection in these tests; force it
// to report no swap commands so the V4 path is the only thing that can flag a swap.
vi.mock('@uniswap/universal-router-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uniswap/universal-router-sdk')>()
  return {
    ...actual,
    CommandParser: {
      ...actual.CommandParser,
      parseCalldata: vi.fn(() => ({ commands: [] })),
    },
  }
})

vi.mock('@uniswap/v4-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uniswap/v4-sdk')>()
  return {
    ...actual,
    V4BaseActionsParser: {
      ...actual.V4BaseActionsParser,
      parseCalldata: vi.fn(),
    },
  }
})

vi.mock('uniswap/src/features/chains/chainInfo', () => ({
  getChainInfo: vi.fn(),
}))

const mockV4Parse = vi.mocked(V4BaseActionsParser.parseCalldata)
const mockGetChainInfo = vi.mocked(getChainInfo)

// A valid-looking selector that isn't approve/permit/permit2Approve, so the flow reaches the
// V4 swap parse rather than short-circuiting earlier.
const SWAP_DATA = '0x3593564c0000000000000000000000000000000000000000000000000000000000000000'

const SWAP_CALL = {
  actions: [{ actionName: 'SWAP_EXACT_IN_SINGLE', actionType: Actions.SWAP_EXACT_IN_SINGLE, params: [] }],
}

function setSupportedURVersions(versions: TradingApi.UniversalRouterVersion[]): void {
  mockGetChainInfo.mockReturnValue({ supportedURVersions: versions } as never)
}

describe('getCalldataInfoFromTransaction — V4 swap version selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("tries the chain's highest supported UR version first for V4 swap calldata", () => {
    setSupportedURVersions([TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1])
    mockV4Parse.mockReturnValue(SWAP_CALL)

    const result = getCalldataInfoFromTransaction({ data: SWAP_DATA, chainId: UniverseChainId.Mainnet })

    expect(result.contractInteractions).toBe(EthSendTransactionRPCActions.Swap)
    // First attempt must use the highest version (2.1.1), not the v2.0 default.
    expect(mockV4Parse).toHaveBeenNthCalledWith(1, SWAP_DATA, URVersion.V2_1_1)
  })

  it('falls back to the default (v2.0) parse when the v2.1.1 attempt throws (single-hop v2.0 calldata)', () => {
    setSupportedURVersions([TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1])
    // 2.1.1 ABI fails to decode older v2.0 calldata; the version-less fallback succeeds.
    mockV4Parse
      .mockImplementationOnce(() => {
        throw new Error('abi decode failure')
      })
      .mockReturnValueOnce(SWAP_CALL)

    const result = getCalldataInfoFromTransaction({ data: SWAP_DATA, chainId: UniverseChainId.Mainnet })

    expect(result.contractInteractions).toBe(EthSendTransactionRPCActions.Swap)
    expect(mockV4Parse).toHaveBeenNthCalledWith(1, SWAP_DATA, URVersion.V2_1_1)
    expect(mockV4Parse).toHaveBeenNthCalledWith(2, SWAP_DATA, undefined)
  })

  it('only attempts the default parse when the chain supports nothing beyond v2.0', () => {
    setSupportedURVersions([TradingApi.UniversalRouterVersion._2_0])
    mockV4Parse.mockReturnValue(SWAP_CALL)

    getCalldataInfoFromTransaction({ data: SWAP_DATA, chainId: UniverseChainId.Mainnet })

    expect(mockV4Parse).toHaveBeenCalledTimes(1)
    expect(mockV4Parse).toHaveBeenCalledWith(SWAP_DATA, undefined)
  })

  it('uses only the default parse when no chainId is provided', () => {
    mockV4Parse.mockReturnValue(SWAP_CALL)

    getCalldataInfoFromTransaction({ data: SWAP_DATA })

    expect(mockGetChainInfo).not.toHaveBeenCalled()
    expect(mockV4Parse).toHaveBeenCalledTimes(1)
    expect(mockV4Parse).toHaveBeenCalledWith(SWAP_DATA, undefined)
  })

  it('does not flag a swap when the decoded V4 call contains no swap actions', () => {
    setSupportedURVersions([TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1])
    mockV4Parse.mockReturnValue({
      actions: [{ actionName: 'SETTLE', actionType: Actions.SETTLE, params: [] }],
    })

    const result = getCalldataInfoFromTransaction({ data: SWAP_DATA, chainId: UniverseChainId.Mainnet })

    expect(result.contractInteractions).not.toBe(EthSendTransactionRPCActions.Swap)
  })
})
