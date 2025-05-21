import { ReactNode, createContext, useCallback, useContext, useState } from 'react'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

type DappInfo = {
  icon?: string
  name?: string
}

type SmartWalletNudgesContextState = {
  activeModal: ModalNameType | null
  openModal: (modal: ModalNameType) => void
  closeModal: () => void
  dappInfo?: DappInfo
  setDappInfo: (info?: DappInfo) => void
}

const SmartWalletNudgesContext = createContext<SmartWalletNudgesContextState | undefined>(undefined)

export function SmartWalletNudgesProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeModal, setActiveModal] = useState<ModalNameType | null>(null)
  const [dappInfo, setDappInfo] = useState<{
    icon?: string
    name?: string
  }>()

  const openModal = useCallback(
    (modal: ModalNameType): void => {
      setActiveModal(modal)
    },
    [setActiveModal],
  )

  const closeModal = useCallback((): void => {
    setActiveModal(null)
  }, [setActiveModal])

  return (
    <SmartWalletNudgesContext.Provider
      value={{
        activeModal,
        openModal,
        closeModal,
        dappInfo,
        setDappInfo,
      }}
    >
      {children}
    </SmartWalletNudgesContext.Provider>
  )
}

export function useSmartWalletNudges(): SmartWalletNudgesContextState {
  const context = useContext(SmartWalletNudgesContext)
  if (!context) {
    throw new Error('useSmartWalletNudges must be used within a SmartWalletNudgesProvider')
  }
  return context
}
