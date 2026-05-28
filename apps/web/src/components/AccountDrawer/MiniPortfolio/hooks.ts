import { atom, useAtom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useMemo } from 'react'

const accountDrawerOpenAtom = atom(false)
const showMoonpayTextAtom = atom(false)

export function useAccountDrawer() {
  const [isOpen, updateAccountDrawerOpen] = useAtom(accountDrawerOpenAtom)
  const setShowMoonpayTextInDrawer = useSetShowMoonpayText()

  const open = useCallback(() => {
    updateAccountDrawerOpen(true)
  }, [updateAccountDrawerOpen])

  const close = useCallback(() => {
    setShowMoonpayTextInDrawer(false)
    updateAccountDrawerOpen(false)
  }, [setShowMoonpayTextInDrawer, updateAccountDrawerOpen])

  const toggle = useCallback(() => {
    updateAccountDrawerOpen((prev) => !prev)
  }, [updateAccountDrawerOpen])

  return useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])
}

// Only show Moonpay text if the user opens the Account Drawer by clicking 'Buy'
function useSetShowMoonpayText() {
  const updateShowMoonpayText = useUpdateAtom(showMoonpayTextAtom)
  return useCallback((newValue: boolean) => updateShowMoonpayText(newValue), [updateShowMoonpayText])
}

export function useShowMoonpayText(): boolean {
  const showMoonpayText = useAtomValue(showMoonpayTextAtom)
  return showMoonpayText
}
