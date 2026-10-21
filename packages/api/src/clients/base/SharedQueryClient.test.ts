import { MutationObserver } from '@tanstack/react-query'
import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import { logger } from 'utilities/src/logger/logger'
import { WalletSecretInPersistedSinkError } from 'utilities/src/security/persistedSinkTripwire'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}))

describe('SharedQueryClient persisted-sink tripwires', () => {
  afterEach(() => {
    SharedQueryClient.getMutationCache().clear()
    SharedQueryClient.getQueryCache().clear()
    vi.useRealTimers()
  })

  it('fails a mutation whose variables carry a wallet secret before mutationFn runs', async () => {
    const mutationFn = vi.fn(async (_variables: { password: string }) => undefined)
    const observer = new MutationObserver(SharedQueryClient, {
      mutationKey: ['unlock', { password: 'hunter2' }],
      mutationFn,
    })

    const error = await observer.mutate({ password: 'hunter2' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(WalletSecretInPersistedSinkError)
    expect((error as Error).message).toContain("'password' found in react-query mutation variables (unlock)")
    expect((error as Error).message).not.toContain('hunter2')
    expect(mutationFn).not.toHaveBeenCalled()
  })

  it('fails a mutation that resolves to a wallet secret', async () => {
    const observer = new MutationObserver(SharedQueryClient, { mutationFn: async () => ({ mnemonic: 'words' }) })

    await expect(observer.mutate()).rejects.toBeInstanceOf(WalletSecretInPersistedSinkError)
    expect(observer.getCurrentResult().data).toBeUndefined()
  })

  it('lets an ordinary mutation through', async () => {
    const observer = new MutationObserver(SharedQueryClient, { mutationFn: async (address: string) => address })

    await expect(observer.mutate('0xabc')).resolves.toBe('0xabc')
  })

  it('surfaces a wallet secret in a query key or query data without hanging the fetch', async () => {
    vi.useFakeTimers()

    await expect(
      SharedQueryClient.fetchQuery({ queryKey: ['vault', { privateKey: '0xkey' }], queryFn: async () => 'ok' }),
    ).resolves.toBe('ok')

    expect(logger.error).toHaveBeenCalledWith(expect.any(WalletSecretInPersistedSinkError), expect.anything())
    const logged = vi.mocked(logger.error).mock.lastCall?.[0]
    if (!(logged instanceof Error)) {
      throw new Error('expected logger.error to receive an Error')
    }
    expect(logged.message).toContain("'1.privateKey' found in react-query query key (vault)")
    expect(logged.message).not.toContain('0xkey')
    expect(() => vi.runAllTimers()).toThrow(logged)
  })
})
