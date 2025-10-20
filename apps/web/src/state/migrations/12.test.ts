import { GraphQLApi } from '@universe/api'
import { createMigrate } from 'redux-persist'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3 } from 'state/migrations/3'
import { migration4 } from 'state/migrations/4'
import { migration5 } from 'state/migrations/5'
import { migration6 } from 'state/migrations/6'
import { migration7 } from 'state/migrations/7'
import { migration8 } from 'state/migrations/8'
import { migration9 } from 'state/migrations/9'
import { migration10 } from 'state/migrations/10'
import { migration11 } from 'state/migrations/11'
import { migration12, NewTransactionState, OldTransactionState, PersistAppStateV12 } from 'state/migrations/12'

const oldTransactionState: OldTransactionState = {
  1: {
    // Confirmed
    '0x0': {
      hash: '0x0',
      addedTime: 0,
      from: '0x0',
      info: {} as any,
      lastCheckedBlockNumber: 0,
      confirmedTime: 5,
      deadline: 10,
      receipt: {
        to: '0x0',
        from: '0x0',
        contractAddress: '0x0',
        transactionIndex: 0,
        blockHash: '0x0',
        transactionHash: '0x0',
        blockNumber: 0,
        status: 1,
      },
    },
    // Pending
    '0x1': {
      hash: '0x01',
      addedTime: 0,
      from: '0x0',
      info: {} as any,
      lastCheckedBlockNumber: 0,
      confirmedTime: 5,
      deadline: 10,
    },
    // Errored (status !== 1)
    '0x2': {
      hash: '0x02',
      addedTime: 0,
      from: '0x0',
      info: {} as any,
      lastCheckedBlockNumber: 0,
      confirmedTime: 5,
      deadline: 10,
      receipt: {
        to: '0x0',
        from: '0x0',
        contractAddress: '0x0',
        transactionIndex: 0,
        blockHash: '0x0',
        transactionHash: '0x0',
        blockNumber: 0,
        status: 0,
      },
    },
  },
}

const newTransactionState: NewTransactionState = {
  1: {
    '0x0': {
      status: GraphQLApi.TransactionStatus.Confirmed,
      hash: '0x0',
      addedTime: 0,
      from: '0x0',
      info: {} as any,
      confirmedTime: 5,
    },
    '0x1': {
      status: GraphQLApi.TransactionStatus.Pending,
      hash: '0x01',
      addedTime: 0,
      from: '0x0',
      info: {} as any,
      lastCheckedBlockNumber: 0,
      deadline: 10,
    },
    '0x2': {
      status: GraphQLApi.TransactionStatus.Failed,
      hash: '0x02',
      addedTime: 0,
      from: '0x0',
      info: {} as any,
      confirmedTime: 5,
    },
  },
}

const previousState: PersistAppStateV12 = {
  transactions: oldTransactionState,
  _persist: {
    version: 11,
    rehydrated: true,
  },
}

describe('migration to v12', () => {
  it('should migrate transaction state to non-receipt version', async () => {
    const migrator = createMigrate(
      {
        1: migration1,
        2: migration2,
        3: migration3,
        4: migration4,
        5: migration5,
        6: migration6,
        7: migration7,
        8: migration8,
        9: migration9,
        10: migration10,
        11: migration11,
        12: migration12,
      },
      { debug: false },
    )
    const result: any = await migrator(previousState, 12)
    expect(result.transactions).toMatchObject(newTransactionState)
  })
})
