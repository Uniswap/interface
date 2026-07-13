import { TradingApi } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEmbeddedWalletCallsStatus } from '~/connection/getCallsStatus'

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: { fetchSwaps: vi.fn() },
}))

const mockFetchSwaps = vi.mocked(TradingApiClient.fetchSwaps)

const TX_HASH = `0x${'ab'.repeat(32)}`
const BATCH_ID = `0x${'cd'.repeat(32)}`

function mockSwaps(rows: Array<{ status: TradingApi.SwapStatus; txHash?: string }>): void {
  mockFetchSwaps.mockResolvedValue({ swaps: rows } as Awaited<ReturnType<typeof TradingApiClient.fetchSwaps>>)
}

function getStatus(): ReturnType<typeof getEmbeddedWalletCallsStatus> {
  return getEmbeddedWalletCallsStatus({ batchId: BATCH_ID, chainId: UniverseChainId.Mainnet })
}

describe('getEmbeddedWalletCallsStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when batchId is missing', async () => {
    await expect(
      getEmbeddedWalletCallsStatus({ batchId: undefined, chainId: UniverseChainId.Mainnet }),
    ).rejects.toThrow('missing batchId')
  })

  it('maps SUCCESS with a resolved tx hash to 200 + receipt', async () => {
    mockSwaps([{ status: TradingApi.SwapStatus.SUCCESS, txHash: TX_HASH }])
    const result = await getStatus()
    expect(result.status).toBe(200)
    expect(result.receipts).toEqual([{ transactionHash: TX_HASH, status: '0x1' }])
  })

  it('stays pending (100) for SUCCESS without a tx hash instead of emitting the batchId', async () => {
    mockSwaps([{ status: TradingApi.SwapStatus.SUCCESS }])
    const result = await getStatus()
    expect(result.status).toBe(100)
    expect(result.receipts).toBeUndefined()
  })

  it('maps FAILED with a tx hash to 400 + a failure receipt', async () => {
    mockSwaps([{ status: TradingApi.SwapStatus.FAILED, txHash: TX_HASH }])
    const result = await getStatus()
    expect(result.status).toBe(400)
    expect(result.receipts).toEqual([{ transactionHash: TX_HASH, status: '0x0' }])
  })

  it('maps EXPIRED to 400 with no receipt', async () => {
    mockSwaps([{ status: TradingApi.SwapStatus.EXPIRED }])
    const result = await getStatus()
    expect(result.status).toBe(400)
    expect(result.receipts).toBeUndefined()
  })

  it('maps PENDING to 100', async () => {
    mockSwaps([{ status: TradingApi.SwapStatus.PENDING }])
    expect((await getStatus()).status).toBe(100)
  })

  it('stays pending (100) when the feed is unreachable', async () => {
    mockFetchSwaps.mockRejectedValue(new Error('network down'))
    expect((await getStatus()).status).toBe(100)
  })

  it('prefers the resolved row when one hash field returns NOT_FOUND', async () => {
    // The batchId is queried in both txHashes + userOpHashes; the non-matching field
    // comes back NOT_FOUND, so only one terminal row is real — pick it.
    mockSwaps([{ status: TradingApi.SwapStatus.NOT_FOUND }, { status: TradingApi.SwapStatus.SUCCESS, txHash: TX_HASH }])
    const result = await getStatus()
    expect(result.status).toBe(200)
    expect(result.receipts).toEqual([{ transactionHash: TX_HASH, status: '0x1' }])
  })
})
