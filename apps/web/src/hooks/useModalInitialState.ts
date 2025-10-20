import { OpenModalParams } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'

type ExtractModalInitialState<T extends OpenModalParams['name']> = Extract<OpenModalParams, { name: T }>['initialState']

/**
 * Hook to get the initial state for a specific modal
 *
 * @param modalName - The name of the modal to get the initial state for
 * @returns The initial state if the modal is open and matches the provided name, otherwise undefined
 *
 * @example
 * ```tsx
 * // For BlockedAccount modal - accessing blockedAddress
 * const blockedAddress = useModalInitialState(ModalName.BlockedAccount)?.blockedAddress
 *
 * // For AddLiquidity modal - accessing position info
 * const positionInfo = useModalInitialState(ModalName.AddLiquidity)
 *
 * // Type-safe: The return type is automatically inferred based on the modal name
 * ```
 */
export function useModalInitialState<T extends OpenModalParams['name']>(
  modalName: T,
): ExtractModalInitialState<T> | undefined {
  const modal = useAppSelector((state) => state.application.openModal)

  if (modal?.name === modalName) {
    return modal.initialState as ExtractModalInitialState<T> | undefined
  }

  return undefined
}
