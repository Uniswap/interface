import { useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'

export type SecretMutationStatus = 'idle' | 'pending' | 'success' | 'error'

export interface UseSecretMutationOptions<TSecret, TData, TError> {
  /** Receives the secret handed to `mutate`. Nothing holds the secret once this call returns. */
  mutationFn: (secret: TSecret) => Promise<TData>
  onSuccess?: (data: TData) => void
  onError?: (error: TError) => void
  onSettled?: (data: TData | undefined, error: TError | null) => void
}

export interface UseSecretMutationResult<TSecret, TData, TError> {
  mutate: (secret: TSecret) => void
  mutateAsync: (secret: TSecret) => Promise<TData>
  reset: () => void
  status: SecretMutationStatus
  isIdle: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  data: TData | undefined
  error: TError | null
}

type SecretMutationState<TData, TError> =
  | { status: 'idle' | 'pending'; data: undefined; error: null }
  | { status: 'success'; data: TData; error: null }
  | { status: 'error'; data: undefined; error: TError }

const IDLE_STATE = { status: 'idle', data: undefined, error: null } as const

/**
 * The `useMutation` surface (mutate, mutateAsync, status flags, data, error, reset) for a function
 * that takes a wallet secret, with no react-query underneath.
 *
 * react-query's mutation cache keeps `variables` on every settled mutation until gc and can persist
 * a paused one to disk, so a secret must never be a mutation argument. This hook keeps only a status
 * in React state: the secret is a parameter of `mutationFn` and is gone when that call returns, and
 * there is no cache for it to reach.
 */
export function useSecretMutation<TSecret, TData = void, TError = Error>({
  mutationFn,
  onSuccess,
  onError,
  onSettled,
}: UseSecretMutationOptions<TSecret, TData, TError>): UseSecretMutationResult<TSecret, TData, TError> {
  const [state, setState] = useState<SecretMutationState<TData, TError>>(IDLE_STATE)
  // Only the most recent call may write state, so a slow earlier call cannot overwrite a newer result.
  const latestCall = useRef(0)

  const mutateAsync = useEvent(async (secret: TSecret): Promise<TData> => {
    const callId = ++latestCall.current
    setState({ status: 'pending', data: undefined, error: null })
    try {
      const data = await mutationFn(secret)
      if (callId === latestCall.current) {
        setState({ status: 'success', data, error: null })
      }
      onSuccess?.(data)
      onSettled?.(data, null)
      return data
    } catch (caught) {
      // `mutationFn` decides what it throws; TError types it for the caller, as with useMutation.
      const error = caught as TError
      if (callId === latestCall.current) {
        setState({ status: 'error', data: undefined, error })
      }
      onError?.(error)
      onSettled?.(undefined, error)
      throw error
    }
  })

  const mutate = useEvent((secret: TSecret): void => {
    // Failures surface through `error` and `onError`, matching useMutation's `mutate`.
    void mutateAsync(secret).catch(() => undefined)
  })

  const reset = useEvent((): void => {
    latestCall.current += 1
    setState(IDLE_STATE)
  })

  return {
    mutate,
    mutateAsync,
    reset,
    status: state.status,
    isIdle: state.status === 'idle',
    isPending: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    data: state.data,
    error: state.error,
  }
}
