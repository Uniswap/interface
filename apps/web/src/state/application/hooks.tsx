import { PopupType } from 'components/Popups/types'
import { useCallback } from 'react'
import { addSuppressedPopups, removeSuppressedPopups } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

// returns functions to suppress and unsuppress popups by type
export function useSuppressPopups(popupTypes: PopupType[]): {
  suppressPopups: () => void
  unsuppressPopups: () => void
} {
  const dispatch = useAppDispatch()
  const suppressPopups = useCallback(() => dispatch(addSuppressedPopups({ popupTypes })), [dispatch, popupTypes])
  const unsuppressPopups = useCallback(() => dispatch(removeSuppressedPopups({ popupTypes })), [dispatch, popupTypes])

  return {
    suppressPopups,
    unsuppressPopups,
  }
}
