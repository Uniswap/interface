import { createLocalTransactionAndSignatureClearingMigration } from 'state/migrations/clearLocalTransactionsAndSignatures'

const previousStateWithLocalTransactions = {
  _persist: {
    version: 29,
    rehydrated: true,
  },
  localWebTransactions: {
    1: {
      '0x0': {
        status: 'these value dont matter as they are not checked',
        hash: '0x0',
        addedTime: 0,
        from: '0x0',
        info: {} as any,
        confirmedTime: 5,
      },
    },
  },
  signatures: {
    '0x0': {
      '0x0': {
        id: '0x0',
      },
    },
  },
}

describe('migration clears local transactions and signatures', () => {
  it('ensure all transactions and signatures are cleared and version is updated correctly', async () => {
    const migration = createLocalTransactionAndSignatureClearingMigration(420)
    const newState = migration(previousStateWithLocalTransactions)
    expect(newState?.localWebTransactions).toEqual({})
    expect(newState?.signatures).toEqual({})
    expect(newState?._persist.version).toEqual(420)
  })
})
