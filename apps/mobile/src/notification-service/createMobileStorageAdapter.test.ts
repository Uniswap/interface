export {}

const mockMMKV = {
  getString: jest.fn(),
  set: jest.fn(),
}

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => mockMMKV),
}))

const mockLoggerError = jest.fn()
jest.mock('utilities/src/logger/logger', () => ({
  getLogger: (): { error: jest.Mock } => ({
    error: mockLoggerError,
  }),
}))

describe('createMobileStorageAdapter', () => {
  let createMobileStorageAdapter: typeof import('./createMobileStorageAdapter').createMobileStorageAdapter

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    jest.doMock('react-native-mmkv', () => ({
      MMKV: jest.fn().mockImplementation(() => mockMMKV),
    }))
    jest.doMock('utilities/src/logger/logger', () => ({
      getLogger: (): { error: jest.Mock } => ({
        error: mockLoggerError,
      }),
    }))
    createMobileStorageAdapter = require('./createMobileStorageAdapter').createMobileStorageAdapter
  })

  describe('has', () => {
    it('returns true when notification ID exists in storage', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      const result = await adapter.has('notif-1')

      expect(result).toBe(true)
    })

    it('returns false when notification ID does not exist in storage', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      const result = await adapter.has('notif-2')

      expect(result).toBe(false)
    })

    it('returns false when storage is empty', async () => {
      mockMMKV.getString.mockReturnValue(null)

      const adapter = createMobileStorageAdapter()
      const result = await adapter.has('notif-1')

      expect(result).toBe(false)
    })

    it('returns false and logs error when JSON parsing fails', async () => {
      mockMMKV.getString.mockReturnValue('invalid json')

      const adapter = createMobileStorageAdapter()
      const result = await adapter.has('notif-1')

      expect(result).toBe(false)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('returns false and logs error when schema validation fails', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { invalidField: 'wrong' },
        }),
      )

      const adapter = createMobileStorageAdapter()
      const result = await adapter.has('notif-1')

      expect(result).toBe(false)
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('add', () => {
    it('adds notification ID with provided timestamp', async () => {
      mockMMKV.getString.mockReturnValue(JSON.stringify({}))

      const adapter = createMobileStorageAdapter()
      await adapter.add('notif-1', { timestamp: 1234567890 })

      expect(mockMMKV.set).toHaveBeenCalledWith(
        'uniswap_notifications_processed',
        JSON.stringify({ 'notif-1': { timestamp: 1234567890 } }),
      )
    })

    it('adds notification ID with current timestamp when no metadata provided', async () => {
      mockMMKV.getString.mockReturnValue(JSON.stringify({}))
      const mockNow = 1700000000000
      jest.spyOn(Date, 'now').mockReturnValue(mockNow)

      const adapter = createMobileStorageAdapter()
      await adapter.add('notif-1')

      expect(mockMMKV.set).toHaveBeenCalledWith(
        'uniswap_notifications_processed',
        JSON.stringify({ 'notif-1': { timestamp: mockNow } }),
      )

      jest.restoreAllMocks()
    })

    it('preserves existing entries when adding new notification', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      await adapter.add('notif-2', { timestamp: 2000 })

      expect(mockMMKV.set).toHaveBeenCalledWith(
        'uniswap_notifications_processed',
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
          'notif-2': { timestamp: 2000 },
        }),
      )
    })

    it('overwrites existing entry with same notification ID', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      await adapter.add('notif-1', { timestamp: 2000 })

      expect(mockMMKV.set).toHaveBeenCalledWith(
        'uniswap_notifications_processed',
        JSON.stringify({
          'notif-1': { timestamp: 2000 },
        }),
      )
    })

    it('logs error when save fails', async () => {
      mockMMKV.getString.mockReturnValue(JSON.stringify({}))
      mockMMKV.set.mockImplementation(() => {
        throw new Error('Storage full')
      })

      const adapter = createMobileStorageAdapter()
      await adapter.add('notif-1', { timestamp: 1000 })

      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('getAll', () => {
    it('returns all notification IDs as a Set', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
          'notif-2': { timestamp: 2000 },
          'notif-3': { timestamp: 3000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      const result = await adapter.getAll()

      expect(result).toEqual(new Set(['notif-1', 'notif-2', 'notif-3']))
    })

    it('returns empty Set when storage is empty', async () => {
      mockMMKV.getString.mockReturnValue(null)

      const adapter = createMobileStorageAdapter()
      const result = await adapter.getAll()

      expect(result).toEqual(new Set())
    })

    it('returns empty Set when storage contains invalid data', async () => {
      mockMMKV.getString.mockReturnValue('not valid json')

      const adapter = createMobileStorageAdapter()
      const result = await adapter.getAll()

      expect(result).toEqual(new Set())
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('deleteOlderThan', () => {
    it('removes entries older than specified timestamp', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-old': { timestamp: 1000 },
          'notif-new': { timestamp: 3000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      await adapter.deleteOlderThan(2000)

      expect(mockMMKV.set).toHaveBeenCalledWith(
        'uniswap_notifications_processed',
        JSON.stringify({
          'notif-new': { timestamp: 3000 },
        }),
      )
    })

    it('removes entries with timestamp equal to threshold', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-exact': { timestamp: 2000 },
          'notif-old': { timestamp: 1999 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      await adapter.deleteOlderThan(2000)

      expect(mockMMKV.set).toHaveBeenCalledWith('uniswap_notifications_processed', JSON.stringify({}))
    })

    it('keeps entries with timestamp greater than threshold', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 2001 },
          'notif-2': { timestamp: 3000 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      await adapter.deleteOlderThan(2000)

      expect(mockMMKV.set).toHaveBeenCalledWith(
        'uniswap_notifications_processed',
        JSON.stringify({
          'notif-1': { timestamp: 2001 },
          'notif-2': { timestamp: 3000 },
        }),
      )
    })

    it('handles empty storage gracefully', async () => {
      mockMMKV.getString.mockReturnValue(null)

      const adapter = createMobileStorageAdapter()
      await adapter.deleteOlderThan(2000)

      expect(mockMMKV.set).toHaveBeenCalledWith('uniswap_notifications_processed', JSON.stringify({}))
    })

    it('removes all entries when all are older than threshold', async () => {
      mockMMKV.getString.mockReturnValue(
        JSON.stringify({
          'notif-1': { timestamp: 1000 },
          'notif-2': { timestamp: 1500 },
        }),
      )

      const adapter = createMobileStorageAdapter()
      await adapter.deleteOlderThan(2000)

      expect(mockMMKV.set).toHaveBeenCalledWith('uniswap_notifications_processed', JSON.stringify({}))
    })
  })
})
