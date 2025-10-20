import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { CopyToClipboardFunction } from 'wallet/src/components/copy/useCopyToClipboard'

/**
 * Hook for copying text to clipboard with notification
 * Web implementation using navigator.clipboard
 */
export function useCopyToClipboard(): CopyToClipboardFunction {
  const dispatch = useDispatch()

  const copyToClipboard = useCallback(
    async ({ textToCopy, copyType }: { textToCopy: string; copyType: CopyNotificationType }) => {
      try {
        await navigator.clipboard.writeText(textToCopy)

        dispatch(
          pushNotification({
            type: AppNotificationType.Copied,
            copyType,
          }),
        )
      } catch (_e) {
        dispatch(
          pushNotification({
            type: AppNotificationType.CopyFailed,
            copyType,
          }),
        )
      }
    },
    [dispatch],
  )

  return copyToClipboard
}
