import { act, renderHook, waitFor } from '@testing-library/react'
import { useSecretMutation } from 'utilities/src/security/useSecretMutation'

const SECRET = 'correct-horse-battery-staple'

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('useSecretMutation', () => {
  it('hands the secret to mutationFn and settles like useMutation', async () => {
    const mutationFn = vi.fn(async (secret: string) => `unlocked:${secret}`)
    const { result } = renderHook(() => useSecretMutation<string, string>({ mutationFn }))

    expect(result.current.isIdle).toBe(true)
    act(() => result.current.mutate(SECRET))
    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mutationFn).toHaveBeenCalledWith(SECRET)
    expect(result.current.data).toBe(`unlocked:${SECRET}`)
  })

  it('keeps the secret out of the hook result', async () => {
    const { result } = renderHook(() => useSecretMutation<string, string>({ mutationFn: async () => 'ok' }))

    act(() => result.current.mutate(SECRET))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(JSON.stringify(result.current)).not.toContain(SECRET)
  })

  it('supports mutateAsync and surfaces mutationFn errors', async () => {
    const failure = new Error('wrong password')
    const { result } = renderHook(() =>
      useSecretMutation<string, void>({
        mutationFn: async () => {
          throw failure
        },
      }),
    )

    await expect(result.current.mutateAsync(SECRET)).rejects.toBe(failure)
    await waitFor(() => expect(result.current.error).toBe(failure))
    expect(result.current.isError).toBe(true)
  })

  it('mutate swallows the rejection and reports it through error and onError', async () => {
    const failure = new Error('wrong password')
    const onError = vi.fn()
    const onSettled = vi.fn()
    const { result } = renderHook(() =>
      useSecretMutation<string, void>({
        mutationFn: async () => {
          throw failure
        },
        onError,
        onSettled,
      }),
    )

    act(() => result.current.mutate(SECRET))

    await waitFor(() => expect(result.current.error).toBe(failure))
    expect(onError).toHaveBeenCalledWith(failure)
    expect(onSettled).toHaveBeenCalledWith(undefined, failure)
  })

  it('calls onSuccess and onSettled with the data', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()
    const { result } = renderHook(() =>
      useSecretMutation<string, string>({
        mutationFn: async (secret) => secret.length.toString(),
        onSuccess,
        onSettled,
      }),
    )

    await act(() => result.current.mutateAsync(SECRET))

    expect(onSuccess).toHaveBeenCalledWith(String(SECRET.length))
    expect(onSettled).toHaveBeenCalledWith(String(SECRET.length), null)
  })

  it('reset returns to idle', async () => {
    const { result } = renderHook(() => useSecretMutation<string, string>({ mutationFn: async () => 'ok' }))

    await act(() => result.current.mutateAsync(SECRET))
    expect(result.current.isSuccess).toBe(true)

    act(() => result.current.reset())
    expect(result.current.isIdle).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('lets the latest call win when an earlier one settles later', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const calls = [first.promise, second.promise]
    const { result } = renderHook(() =>
      useSecretMutation<string, string>({ mutationFn: () => calls.shift() ?? Promise.resolve('unexpected') }),
    )

    act(() => result.current.mutate('first'))
    act(() => result.current.mutate('second'))

    await act(async () => {
      second.resolve('second-result')
      await second.promise
    })
    await waitFor(() => expect(result.current.data).toBe('second-result'))

    await act(async () => {
      first.resolve('first-result')
      await first.promise
    })
    expect(result.current.data).toBe('second-result')
  })

  it('treats an empty string as a provided secret', async () => {
    const mutationFn = vi.fn(async (secret: string) => secret)
    const { result } = renderHook(() => useSecretMutation<string, string>({ mutationFn }))

    act(() => result.current.mutate(''))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mutationFn).toHaveBeenCalledWith('')
  })
})
