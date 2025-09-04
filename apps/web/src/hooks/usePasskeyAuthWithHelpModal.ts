import { UseMutationOptions, UseMutationResult, useMutation } from '@tanstack/react-query'
import { useModalState } from 'hooks/useModalState'
import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { PasskeysHelpModalTypes } from 'uniswap/src/features/passkey/PasskeysHelpModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'

export const PasskeysHelpModalTypeAtom = atom<PasskeysHelpModalTypes>(PasskeysHelpModalTypes.Default)

/**
 * Hook that provides a wrapper around useMutation for passkey operations
 * Shows the passkey help modal on error
 *
 * @param mutationFn - The function to execute when the mutation is triggered
 * @param options - Additional options for the mutation
 * @returns The mutation result with added handleError function
 */
export function usePasskeyAuthWithHelpModal<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { openModal: openPasskeysHelpModal } = useModalState(ModalName.PasskeysHelp)
  const setPasskeysHelpModalType = useUpdateAtom(PasskeysHelpModalTypeAtom)

  return useMutation({
    mutationFn,
    ...options,
    // eslint-disable-next-line max-params
    onError: (error: TError, variables: TVariables, context: TContext | undefined) => {
      const errorContext = {
        variables,
        context,
        message: '',
        type: PasskeysHelpModalTypes.Default,
      }
      let errorType = PasskeysHelpModalTypes.Default

      // Verify if the error message contains a transactionID from our BE
      const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
      if (error instanceof Error && uuidRegex.test(error.message)) {
        if (error.message.includes('not_found')) {
          errorType = PasskeysHelpModalTypes.InvalidPasskey
        } else {
          errorType = PasskeysHelpModalTypes.TechnicalError
        }
        errorContext.message = error.message
        errorContext.type = errorType
      }

      setPasskeysHelpModalType(errorType)
      logger.error(error, {
        tags: {
          file: 'usePasskeyAuthWithHelpModal',
          function: mutationFn.name,
        },
        extra: errorContext,
      })
      openPasskeysHelpModal()
      options?.onError?.(error, variables, context)
    },
  })
}
