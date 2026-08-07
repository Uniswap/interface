import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const mocks = vi.hoisted(() => ({
  createMonitoredSaga: vi.fn(({ name, saga }: { name: string; saga: () => Generator }) => ({
    name,
    wrappedSaga: saga,
    reducer: vi.fn(),
    actions: {},
  })),
  createSaga: vi.fn(() => vi.fn()),
  getSharedTransactionSagaDependencies: vi.fn(() => ({})),
}))

vi.mock('uniswap/src/utils/saga', () => ({
  createMonitoredSaga: mocks.createMonitoredSaga,
}))

vi.mock('wallet/src/features/transactions/configuredSagas', () => ({
  getSharedTransactionSagaDependencies: mocks.getSharedTransactionSagaDependencies,
}))

vi.mock('wallet/src/features/transactions/swap/executePlanSaga', () => ({
  createExecutePlanSaga: mocks.createSaga,
}))

vi.mock('wallet/src/features/transactions/swap/executeSwapSaga', () => ({
  createExecuteSwapSaga: mocks.createSaga,
}))

vi.mock('wallet/src/features/transactions/swap/executeUserOpSwapSaga', () => ({
  createExecuteUserOpSwapSaga: mocks.createSaga,
}))

vi.mock('wallet/src/features/transactions/swap/prepareAndSignSwapSaga', () => ({
  createPrepareAndSignSwapSaga: mocks.createSaga,
}))

describe('configured swap sagas', () => {
  it('configures executePlan with a 30-minute timeout', async () => {
    await import('wallet/src/features/transactions/swap/configuredSagas')

    expect(mocks.createMonitoredSaga).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'executePlan',
        options: {
          parallel: true,
          timeoutDuration: 30 * ONE_MINUTE_MS,
        },
      }),
    )
  })
})
