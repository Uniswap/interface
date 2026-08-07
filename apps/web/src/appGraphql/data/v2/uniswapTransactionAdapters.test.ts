import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  Token,
  TokenProject,
  TransactionEventType,
  TransactionTokenSide,
  UniswapTransaction,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { uniswapTransactionToPoolTx } from '~/appGraphql/data/v2/uniswapTransactionAdapters'

const USDC = new Token({
  chainId: 1,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  project: new TokenProject({ logoUrl: 'https://logo.example/usdc.png' }),
})

const WETH = new Token({
  chainId: 1,
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
})

function makeTx(overrides: Partial<ConstructorParameters<typeof UniswapTransaction>[0]> = {}): UniswapTransaction {
  return new UniswapTransaction({
    chainId: 1,
    txHash: '0xabc123',
    timestampMs: 1716220800000n,
    eventType: TransactionEventType.SWAP,
    protocolVersion: ProtocolVersion.V3,
    poolId: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
    token0: new TransactionTokenSide({ token: USDC, amount: '84200.500000', amountUsd: 84200.5 }),
    token1: new TransactionTokenSide({ token: WETH, amount: '31.78', amountUsd: 84200.5 }),
    amountUsd: 84200.5,
    walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ...overrides,
  })
}

describe('uniswapTransactionToPoolTx', () => {
  it('maps a swap row to the PoolTxFragment shape', () => {
    const result = uniswapTransactionToPoolTx(makeTx(), 0)

    expect(result).toMatchObject({
      chain: GraphQLApi.Chain.Ethereum,
      protocolVersion: GraphQLApi.ProtocolVersion.V3,
      type: GraphQLApi.PoolTransactionType.Swap,
      hash: '0xabc123',
      account: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      token0Quantity: '84200.500000',
      token1Quantity: '31.78',
      usdValue: { value: 84200.5 },
    })
  })

  it('converts timestampMs (bigint ms) to seconds', () => {
    expect(uniswapTransactionToPoolTx(makeTx(), 0)?.timestamp).toBe(1716220800)
  })

  it.each([
    [TransactionEventType.SWAP, GraphQLApi.PoolTransactionType.Swap],
    [TransactionEventType.ADD, GraphQLApi.PoolTransactionType.Add],
    [TransactionEventType.REMOVE, GraphQLApi.PoolTransactionType.Remove],
  ])('maps event type %s to %s', (eventType, expected) => {
    expect(uniswapTransactionToPoolTx(makeTx({ eventType }), 0)?.type).toBe(expected)
  })

  it.each([
    [ProtocolVersion.V2, GraphQLApi.ProtocolVersion.V2],
    [ProtocolVersion.V3, GraphQLApi.ProtocolVersion.V3],
    [ProtocolVersion.V4, GraphQLApi.ProtocolVersion.V4],
  ])('maps protocol version %s to %s', (protocolVersion, expected) => {
    expect(uniswapTransactionToPoolTx(makeTx({ protocolVersion }), 0)?.protocolVersion).toBe(expected)
  })

  it('drops rows with unspecified event type, unspecified protocol version, or unknown chain', () => {
    expect(uniswapTransactionToPoolTx(makeTx({ eventType: TransactionEventType.UNSPECIFIED }), 0)).toBeUndefined()
    expect(uniswapTransactionToPoolTx(makeTx({ protocolVersion: ProtocolVersion.UNSPECIFIED }), 0)).toBeUndefined()
    expect(uniswapTransactionToPoolTx(makeTx({ chainId: 999999 }), 0)).toBeUndefined()
  })

  it('maps token sides including project logo', () => {
    const result = uniswapTransactionToPoolTx(makeTx(), 0)

    expect(result?.token0).toMatchObject({
      chain: GraphQLApi.Chain.Ethereum,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
      project: { name: 'USD Coin', logo: { url: 'https://logo.example/usdc.png' } },
    })
    expect(result?.token1.project?.logo).toBeUndefined()
    expect(result?.token1.project?.name).toBe('Wrapped Ether')
  })

  it('treats an empty token address as undefined', () => {
    const tx = makeTx({
      token0: new TransactionTokenSide({ token: new Token({ chainId: 1, address: '', symbol: 'ETH', decimals: 18 }) }),
    })

    expect(uniswapTransactionToPoolTx(tx, 0)?.token0.address).toBeUndefined()
  })

  it('defaults a missing amount to "0"', () => {
    const tx = makeTx({ token0: new TransactionTokenSide({ token: USDC, amountUsd: 1 }) })

    expect(uniswapTransactionToPoolTx(tx, 0)?.token0Quantity).toBe('0')
  })

  it('generates unique row ids for multiple events within one tx hash', () => {
    const first = uniswapTransactionToPoolTx(makeTx(), 0)
    const second = uniswapTransactionToPoolTx(makeTx({ eventType: TransactionEventType.ADD }), 1)
    const swapDuplicate = uniswapTransactionToPoolTx(makeTx(), 2)

    const ids = [first?.id, second?.id, swapDuplicate?.id]
    expect(new Set(ids).size).toBe(3)
  })
})
