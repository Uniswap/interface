import { type PersistedClient } from '@tanstack/react-query-persist-client'
import { createPersister } from 'uniswap/src/data/apiClients/createPersister.web'

// Mock idb-keyval to use in-memory storage for tests
let mockStorage: Map<string, string>

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockStorage.get(key)),
  set: vi.fn(async (key: string, value: string) => {
    mockStorage.set(key, value)
  }),
  del: vi.fn(async (key: string) => {
    mockStorage.delete(key)
  }),
}))

/**
 * Helper to create mock PersistedClient data for tests
 */
function createPersistedClientData(
  queryData: unknown | unknown[],
  queryKey: string | string[] = 'test',
): PersistedClient {
  const isMultipleQueries = Array.isArray(queryData) && Array.isArray(queryKey)
  const queries = isMultipleQueries
    ? (queryData as unknown[]).map((data, index) => ({
        queryKey: [(queryKey as string[])[index]],
        queryHash: `${(queryKey as string[])[index]}-hash`,
        state: { data } as any,
      }))
    : [
        {
          queryKey: [queryKey as string],
          queryHash: `${queryKey as string}-hash`,
          state: { data: queryData } as any,
        },
      ]

  return {
    timestamp: Date.now(),
    buster: 'v0',
    clientState: {
      queries,
      mutations: [],
    },
  }
}

describe('createPersister', () => {
  beforeEach(() => {
    mockStorage = new Map<string, string>()
  })

  it('should persist and restore a client without BigInt values', async () => {
    const persister = createPersister('test-key')
    const client = createPersistedClientData({ value: 123, name: 'test' })

    await persister.persistClient(client)
    const restored = await persister.restoreClient()

    expect(restored).toBeDefined()
    expect(restored?.buster).toBe('v0')
    expect(restored?.clientState.queries).toHaveLength(1)
    expect(restored?.clientState.queries[0]?.state.data).toEqual({ value: 123, name: 'test' })
  })

  it('should persist and restore a client with BigInt values', async () => {
    const persister = createPersister('test-bigint-key')
    const client = createPersistedClientData(
      {
        balance: BigInt('123456789012345678901234567890'),
        tokens: [
          { amount: BigInt(1000000000000000000), symbol: 'ETH' },
          { amount: BigInt(500000000000000000), symbol: 'USDC' },
        ],
      },
      'portfolio',
    )

    await persister.persistClient(client)
    const restored = await persister.restoreClient()

    expect(restored).toBeDefined()
    const restoredData = restored?.clientState.queries[0]?.state.data as any
    expect(restoredData.balance).toBe(BigInt('123456789012345678901234567890'))
    expect(typeof restoredData.balance).toBe('bigint')
    expect(restoredData.tokens[0].amount).toBe(BigInt(1000000000000000000))
    expect(restoredData.tokens[1].amount).toBe(BigInt(500000000000000000))
  })

  it('should return undefined when no client is persisted', async () => {
    const persister = createPersister('non-existent-key')
    const restored = await persister.restoreClient()
    expect(restored).toBeUndefined()
  })

  it('should handle mixed types with BigInt', async () => {
    const persister = createPersister('test-mixed-key')
    const client = createPersistedClientData(
      {
        bigIntValue: BigInt(123),
        numberValue: 456,
        stringValue: 'test',
        boolValue: true,
        nullValue: null,
        arrayValue: [BigInt(1), 'two', 3, true, null],
        objectValue: { nested: BigInt(999) },
      },
      'mixed',
    )

    await persister.persistClient(client)
    const restored = await persister.restoreClient()

    expect(restored).toBeDefined()
    const restoredData = restored?.clientState.queries[0]?.state.data as any
    expect(restoredData.bigIntValue).toBe(BigInt(123))
    expect(restoredData.numberValue).toBe(456)
    expect(restoredData.stringValue).toBe('test')
    expect(restoredData.boolValue).toBe(true)
    expect(restoredData.nullValue).toBe(null)
    expect(restoredData.arrayValue[0]).toBe(BigInt(1))
    expect(restoredData.arrayValue[1]).toBe('two')
    expect(restoredData.objectValue.nested).toBe(BigInt(999))
  })

  it('should remove persisted client', async () => {
    const persister = createPersister('test-remove-key')
    const client = createPersistedClientData({ test: 'data' })

    await persister.persistClient(client)
    let restored = await persister.restoreClient()
    expect(restored).toBeDefined()

    await persister.removeClient()
    restored = await persister.restoreClient()
    expect(restored).toBeUndefined()
  })

  it('should handle multiple queries in clientState', async () => {
    const persister = createPersister('test-multiple-key')
    const client = createPersistedClientData([{ amount: BigInt(100) }, { amount: BigInt(200) }], ['query1', 'query2'])

    await persister.persistClient(client)
    const restored = await persister.restoreClient()

    expect(restored).toBeDefined()
    expect(restored?.clientState.queries).toHaveLength(2)
    const data1 = restored?.clientState.queries[0]?.state.data as any
    const data2 = restored?.clientState.queries[1]?.state.data as any
    expect(data1.amount).toBe(BigInt(100))
    expect(data2.amount).toBe(BigInt(200))
  })
})
