import { useCallback } from 'react'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useAppDispatch } from 'wallet/src/state'

export function useCopyToClipboard(): ({
  textToCopy,
  copyType,
}: {
  textToCopy: string
  copyType: CopyNotificationType
}) => Promise<void> {
  const dispatch = useAppDispatch()

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
      } catch (e) {
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
