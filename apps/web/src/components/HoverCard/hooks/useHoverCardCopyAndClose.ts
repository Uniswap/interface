import { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { COPY_CLOSE_DELAY } from 'uniswap/src/constants/misc'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'

/** Copies a contract address, notifies, and dismisses the card shortly after (matching the Portfolio tokens table menu). */
export function useHoverCardCopyAndClose({ onClose }: { onClose: () => void }): {
  isCopied: boolean
  copyAndClose: (address: string) => void
} {
  const dispatch = useDispatch()
  const [isCopied, copyToClipboard] = useCopyClipboard()
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => (): void => clearTimeout(closeTimerRef.current), [])

  const copyAndClose = useCallback(
    (address: string): void => {
      copyToClipboard(address)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.ContractAddress,
        }),
      )
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = setTimeout(onClose, COPY_CLOSE_DELAY)
    },
    [copyToClipboard, dispatch, onClose],
  )

  return { isCopied, copyAndClose }
}
