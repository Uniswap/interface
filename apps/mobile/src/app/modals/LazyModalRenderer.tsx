import { useDispatch, useSelector } from 'react-redux'
import { ModalsState } from 'src/features/modals/ModalsState'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'

/**
 * Delays evaluating `children` until modal is open
 * @param modalName name of the modal for which to track open state
 * @param WrappedComponent react node to render once modal opens
 */
export function LazyModalRenderer({
  name,
  children,
  disableErrorBoundary = false,
}: {
  name: keyof ModalsState
  children: JSX.Element
  disableErrorBoundary?: boolean
}): JSX.Element | null {
  const dispatch = useDispatch()

  const modalState = useSelector(selectModalState(name))

  if (!modalState.isOpen) {
    // avoid doing any work until the modal needs to be open
    return null
  }

  if (disableErrorBoundary) {
    return children
  }

  return (
    <ErrorBoundary showNotification fallback={null} name={name} onError={() => dispatch(closeModal({ name }))}>
      {children}
    </ErrorBoundary>
  )
}
