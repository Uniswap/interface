import { useEffect, useState } from 'react'

export const useWidgetDialog = () => {
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  const [dialogVisible, setDialogVisible] = useState(false)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDialogVisible((dialog?.childElementCount ?? 0) > 0)
    })
    if (dialog) {
      observer.observe(dialog, { childList: true })
    }
    return () => {
      observer.disconnect()
    }
  }, [dialog])

  return { dialog, setDialog, dialogVisible }
}
