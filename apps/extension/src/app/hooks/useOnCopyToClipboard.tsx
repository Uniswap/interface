import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'

export function useCopyToClipboard(): ({
  textToCopy,
  copyType,
}: {
  textToCopy: string
  copyType: CopyNotificationType
}) => Promise<void> {
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
