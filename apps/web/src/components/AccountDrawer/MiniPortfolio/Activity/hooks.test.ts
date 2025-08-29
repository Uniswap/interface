import { combineActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { ActivityMap } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

describe('Activity combining logic', () => {
  describe('combineActivities', () => {
    it('should deduplicate activities with the same hash from local and remote', () => {
      const account = '0x123'
      const txHash = '0xabc123'
      const localMap: ActivityMap = {
        [txHash]: {
          id: 'local-id-1',
          hash: txHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 1000,
          from: account,
          title: 'Swap',
        },
      }
      const remoteMap: ActivityMap = {
        [txHash]: {
          id: 'remote-id-different',
          hash: txHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 1000,
          from: account,
          title: 'Swap',
        },
      }
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(1)
      expect(combined[0].hash).toBe(txHash)
      expect(combined[0].status).toBe(TransactionStatus.Success)
      expect(combined[0].id).toBe('remote-id-different')
    })
    it('should include activities that only exist locally', () => {
      const account = '0x123'
      const localOnlyHash = '0xlocal123'
      const localMap: ActivityMap = {
        [localOnlyHash]: {
          id: 'local-only-id',
          hash: localOnlyHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 1000,
          from: account,
          title: 'Pending Swap',
        },
      }
      const remoteMap: ActivityMap = {}
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(1)
      expect(combined[0].hash).toBe(localOnlyHash)
      expect(combined[0].status).toBe(TransactionStatus.Pending)
    })
    it('should include activities that only exist remotely', () => {
      const account = '0x123'
      const remoteOnlyHash = '0xremote456'
      const localMap: ActivityMap = {}
      const remoteMap: ActivityMap = {
        [remoteOnlyHash]: {
          id: 'remote-only-id',
          hash: remoteOnlyHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 2000,
          from: account,
          title: 'Completed Swap',
        },
      }
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(1)
      expect(combined[0].hash).toBe(remoteOnlyHash)
      expect(combined[0].status).toBe(TransactionStatus.Success)
    })
    it('should handle cancelled transactions correctly by preferring local data', () => {
      const account = '0x123'
      const txHash = '0xcancelled123'
      const localMap: ActivityMap = {
        [txHash]: {
          id: 'local-cancelled-id',
          hash: txHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Canceled,
          timestamp: 1000,
          from: account,
          title: 'Cancelled Swap',
        },
      }
      const remoteMap: ActivityMap = {
        [txHash]: {
          id: 'remote-success-id',
          hash: txHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 1000,
          from: account,
          title: 'Swap',
        },
      }
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(1)
      const activity = combined[0]
      expect(activity.hash).toBe(txHash)
      expect(activity.status).toBe(TransactionStatus.Canceled)
      expect(activity.id).toBe('local-cancelled-id')
    })
    it('should handle cross-chain cancelled transactions by showing remote activity', () => {
      const account = '0x123'
      const txHash = '0xcrosschain123'
      const localMap: ActivityMap = {
        [txHash]: {
          id: 'local-cancelled',
          hash: txHash,
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Canceled,
          timestamp: 1000,
          from: account,
          title: 'Cancelled',
        },
      }
      const remoteMap: ActivityMap = {
        [txHash]: {
          id: 'remote-success',
          hash: txHash,
          chainId: UniverseChainId.ArbitrumOne,
          status: TransactionStatus.Success,
          timestamp: 1000,
          from: account,
          title: 'Success on Arbitrum',
        },
      }
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(1)
      const activity = combined[0]
      expect(activity.chainId).toBe(UniverseChainId.ArbitrumOne)
      expect(activity.status).toBe(TransactionStatus.Success)
    })
    it('should handle multiple activities with different hashes', () => {
      const account = '0x123'
      const localMap: ActivityMap = {
        '0xhash1': {
          id: 'local-1',
          hash: '0xhash1',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 1000,
          from: account,
          title: 'Swap 1',
        },
        '0xhash2': {
          id: 'local-2',
          hash: '0xhash2',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 2000,
          from: account,
          title: 'Swap 2',
        },
      }
      const remoteMap: ActivityMap = {
        '0xhash2': {
          id: 'remote-2-different',
          hash: '0xhash2',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 2000,
          from: account,
          title: 'Swap 2',
        },
        '0xhash3': {
          id: 'remote-3',
          hash: '0xhash3',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Success,
          timestamp: 3000,
          from: account,
          title: 'Swap 3',
        },
      }
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(3)
      const hash1Activity = combined.find((a) => a.hash === '0xhash1')
      const hash2Activity = combined.find((a) => a.hash === '0xhash2')
      const hash3Activity = combined.find((a) => a.hash === '0xhash3')
      expect(hash1Activity?.status).toBe(TransactionStatus.Pending)
      expect(hash2Activity?.status).toBe(TransactionStatus.Success)
      expect(hash2Activity?.id).toBe('remote-2-different')
      expect(hash3Activity?.status).toBe(TransactionStatus.Success)
    })
    it('should handle undefined values in maps', () => {
      const account = '0x123'
      const localMap: ActivityMap = {
        '0xhash1': undefined,
        '0xhash2': {
          id: 'local-2',
          hash: '0xhash2',
          chainId: UniverseChainId.Mainnet,
          status: TransactionStatus.Pending,
          timestamp: 1000,
          from: account,
          title: 'Valid Activity',
        },
      }
      const remoteMap: ActivityMap = {
        '0xhash3': undefined,
      }
      const combined = combineActivities(localMap, remoteMap)
      expect(combined).toHaveLength(1)
      expect(combined[0].hash).toBe('0xhash2')
    })
    it('should handle empty maps gracefully', () => {
      const combined = combineActivities({}, {})
      expect(combined).toHaveLength(0)
    })
  })
  describe('Map key verification', () => {
    it('should verify that activities are keyed by hash not by id', () => {
      const activity = {
        id: 'activity-id-123',
        hash: '0xtransaction-hash-456',
        chainId: UniverseChainId.Mainnet,
        status: TransactionStatus.Success,
        timestamp: 1000,
        from: '0xuser',
        title: 'Test Activity',
      }
      const activityMap: ActivityMap = {
        [activity.hash]: activity,
      }
      expect(activityMap['0xtransaction-hash-456']).toBeDefined()
      expect(activityMap['0xtransaction-hash-456']?.id).toBe('activity-id-123')
      expect(activityMap['activity-id-123']).toBeUndefined()
    })
    it('should ensure no duplicate entries when same transaction has different IDs', () => {
      const txHash = '0xsame-hash'
      const wrongMap = {
        'local-id': { id: 'local-id', hash: txHash, status: TransactionStatus.Pending },
        'remote-id': { id: 'remote-id', hash: txHash, status: TransactionStatus.Success },
      }
      expect(Object.keys(wrongMap)).toHaveLength(2)
      const correctMap: ActivityMap = {}
      correctMap[txHash] = {
        id: 'local-id',
        hash: txHash,
        status: TransactionStatus.Pending,
        chainId: UniverseChainId.Mainnet,
        timestamp: 1000,
        from: '0x',
        title: '',
      }
      correctMap[txHash] = {
        id: 'remote-id',
        hash: txHash,
        status: TransactionStatus.Success,
        chainId: UniverseChainId.Mainnet,
        timestamp: 1000,
        from: '0x',
        title: '',
      }
      expect(Object.keys(correctMap)).toHaveLength(1)
      expect(correctMap[txHash].id).toBe('remote-id')
    })
  })
})
