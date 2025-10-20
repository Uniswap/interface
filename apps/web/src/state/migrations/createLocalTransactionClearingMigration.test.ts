import { createLocalTransactionClearingMigration } from 'state/migrations/createLocalTransactionClearingMigration'

const previousStateWithLocalTransactions = {
  _persist: {
    version: 24,
    rehydrated: true,
  },
  transactions: {
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
}

describe('migration to clear local transactions', () => {
  it('ensure all transactions are cleared and version is updated correctly', async () => {
    const migration = createLocalTransactionClearingMigration(420)
    const newState = migration(previousStateWithLocalTransactions)
    expect(newState?.transactions).toEqual({})
    expect(newState?._persist.version).toEqual(420)
  })
})
