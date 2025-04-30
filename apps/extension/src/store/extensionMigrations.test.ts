import { migratePendingDappRequestsToRecord } from 'src/store/extensionMigrations'

describe('migratePendingDappRequestsToRecord', () => {
  it('empty pending → empty requests', () =>
    expect(
      migratePendingDappRequestsToRecord({
        dappRequests: { pending: [] },
        otherData: 'value',
      }),
    ).toEqual({
      dappRequests: { requests: {} },
      otherData: 'value',
    }))

  it('sets sequential timestamps', () => {
    const mockTime = 1000
    jest.spyOn(Date, 'now').mockReturnValue(mockTime)

    const result = migratePendingDappRequestsToRecord({
      dappRequests: {
        pending: [0, 1, 2].map((i) => ({ dappRequest: { requestId: `r${i}` } })),
      },
    })

    expect(result.dappRequests.requests.r0.createdAt).toBe(mockTime)
    expect(result.dappRequests.requests.r1.createdAt).toBe(mockTime + 1000)
    expect(result.dappRequests.requests.r2.createdAt).toBe(mockTime + 2000)

    jest.restoreAllMocks()
  })

  it('preserves data and handles missing IDs', () => {
    const mockData = {
      dappRequests: {
        pending: [
          { dappRequest: { type: 'Missing' } }, // Missing ID
          { dappRequest: { requestId: 'id', data: { x: 1 } }, meta: 'kept' },
        ],
      },
    }

    const result = migratePendingDappRequestsToRecord(mockData)

    // Verify only valid request exists and contains original data
    expect(Object.keys(result.dappRequests.requests)).toEqual(['id'])
    expect(result.dappRequests.requests.id).toMatchObject({
      dappRequest: { requestId: 'id', data: { x: 1 } },
      meta: 'kept',
      createdAt: expect.any(Number),
    })
  })
})
