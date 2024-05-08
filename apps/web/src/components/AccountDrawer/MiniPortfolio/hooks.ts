import { atom, useAtom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback } from 'react'

const accountDrawerOpenAtom = atom(false)
const showMoonpayTextAtom = atom(false)

export function useToggleAccountDrawer() {
  const [open, updateAccountDrawerOpen] = useAtom(accountDrawerOpenAtom)
  const setShowMoonpayTextInDrawer = useSetShowMoonpayText()

  return useCallback(() => {
    updateAccountDrawerOpen(!open)
    if (open) {
      setShowMoonpayTextInDrawer(false)
    }
  }, [open, setShowMoonpayTextInDrawer, updateAccountDrawerOpen])
}

export function useCloseAccountDrawer() {
  const updateAccountDrawerOpen = useUpdateAtom(accountDrawerOpenAtom)
  return useCallback(() => updateAccountDrawerOpen(false), [updateAccountDrawerOpen])
}

export function useOpenAccountDrawer() {
  const updateAccountDrawerOpen = useUpdateAtom(accountDrawerOpenAtom)
  return useCallback(() => updateAccountDrawerOpen(true), [updateAccountDrawerOpen])
}

export function useAccountDrawer(): [boolean, () => void] {
  const accountDrawerOpen = useAtomValue(accountDrawerOpenAtom)
  return [accountDrawerOpen, useToggleAccountDrawer()]
}

// Only show Moonpay text if the user opens the Account Drawer by clicking 'Buy'
export function useSetShowMoonpayText() {
  const updateShowMoonpayText = useUpdateAtom(showMoonpayTextAtom)
  return useCallback((newValue: boolean) => updateShowMoonpayText(newValue), [updateShowMoonpayText])
}

export function useShowMoonpayText(): boolean {
  const showMoonpayText = useAtomValue(showMoonpayTextAtom)
  return showMoonpayText
}
