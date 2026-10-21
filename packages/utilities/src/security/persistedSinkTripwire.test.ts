import { isDevEnv, isTestEnv } from '@universe/environment'
import { applyMiddleware, legacy_createStore } from 'redux'
import { logger } from 'utilities/src/logger/logger'
import {
  assertNoSecretsInPersistedSink,
  surfacePersistedSinkError,
  WalletSecretInPersistedSinkError,
} from 'utilities/src/security/persistedSinkTripwire'
import { persistedSinkTripwireMiddleware } from 'utilities/src/security/persistedSinkTripwireMiddleware'

vi.mock('@universe/environment', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/environment')>()),
  isDevEnv: vi.fn(() => true),
  isTestEnv: vi.fn(() => false),
}))
vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn() },
}))

beforeEach(() => {
  vi.mocked(isDevEnv).mockReturnValue(true)
  vi.mocked(isTestEnv).mockReturnValue(false)
})

describe('assertNoSecretsInPersistedSink', () => {
  it('throws on a wallet secret and names the path and sink', () => {
    expect(() =>
      assertNoSecretsInPersistedSink({
        sink: 'react-query mutation variables',
        value: { variables: { newPassword: 'x' } },
        label: 'unkeyed mutation',
      }),
    ).toThrow(WalletSecretInPersistedSinkError)
    expect(() =>
      assertNoSecretsInPersistedSink({ sink: 'redux action', value: { payload: { mnemonic: 'w' } }, label: 'a/b' }),
    ).toThrow(/'payload\.mnemonic' found in redux action \(a\/b\)/)
  })

  it('is silent on ordinary values', () => {
    expect(() =>
      assertNoSecretsInPersistedSink({
        sink: 'react-query query data',
        value: { mnemonicId: 'm1', email: 'a@b.c', accounts: [{ address: '0xabc' }] },
        label: 'accounts',
      }),
    ).not.toThrow()
  })

  it('does nothing outside dev and test', () => {
    vi.mocked(isDevEnv).mockReturnValue(false)
    expect(() =>
      assertNoSecretsInPersistedSink({ sink: 'redux action', value: { payload: { password: 'x' } }, label: 'a' }),
    ).not.toThrow()
  })
})

describe('surfacePersistedSinkError', () => {
  it('logs immediately and rethrows on the next tick', () => {
    vi.useFakeTimers()
    const error = new Error('boom')
    surfacePersistedSinkError(error)
    expect(logger.error).toHaveBeenCalledWith(error, expect.anything())
    expect(() => vi.runAllTimers()).toThrow(error)
    vi.useRealTimers()
  })
})

describe('persistedSinkTripwireMiddleware', () => {
  function counterReducer(state: { count: number } = { count: 0 }, action: { type: string }): { count: number } {
    return action.type === 'inc' ? { count: state.count + 1 } : state
  }

  it('fails the dispatch of an action carrying a wallet secret before it reaches the reducer', () => {
    const store = legacy_createStore(counterReducer, applyMiddleware(persistedSinkTripwireMiddleware))
    expect(() => store.dispatch({ type: 'inc', payload: { privateKey: '0xkey' } })).toThrow(
      WalletSecretInPersistedSinkError,
    )
    expect(store.getState()).toEqual({ count: 0 })
  })

  it('passes ordinary actions through', () => {
    const store = legacy_createStore(counterReducer, applyMiddleware(persistedSinkTripwireMiddleware))
    store.dispatch({ type: 'inc', payload: { address: '0xabc' } })
    expect(store.getState()).toEqual({ count: 1 })
  })
})
