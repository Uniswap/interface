import type { TransactionSettingsState } from 'uniswap/src/features/transactions/components/settings/types'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  type FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { isDevEnv } from 'utilities/src/environment/env'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
import { create, type UseBoundStore } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { type StoreApi } from 'zustand/vanilla'

export const initialTransactionSettingsState: TransactionSettingsState = {
  customSlippageTolerance: undefined,
  customDeadline: undefined,
  selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
  slippageWarningModalSeen: false,
  isV4HookPoolsEnabled: true,
}

export type TransactionSettingsStoreState = TransactionSettingsState & {
  actions: {
    setCustomSlippageTolerance: (tolerance: number | undefined) => void
    setCustomDeadline: (deadline: number | undefined) => void
    setSelectedProtocols: (protocols: FrontendSupportedProtocol[]) => void
    setSlippageWarningModalSeen: (seen: boolean) => void
    setIsV4HookPoolsEnabled: (enabled: boolean) => void
    toggleProtocol: (protocol: FrontendSupportedProtocol) => void
  }
}

export type TransactionSettingsStore = UseBoundStore<StoreApi<TransactionSettingsStoreState>>

export const createTransactionSettingsStore = (): { store: TransactionSettingsStore; cleanup: () => void } => {
  const store = create<TransactionSettingsStoreState>()(
    devtools(
      subscribeWithSelector((set, get) => ({
        ...initialTransactionSettingsState,
        actions: {
          setCustomSlippageTolerance: (tolerance: number | undefined): void =>
            set({ customSlippageTolerance: tolerance }),
          setCustomDeadline: (deadline: number | undefined): void => set({ customDeadline: deadline }),
          setSelectedProtocols: (protocols: FrontendSupportedProtocol[]): void => set({ selectedProtocols: protocols }),
          setSlippageWarningModalSeen: (seen: boolean): void => set({ slippageWarningModalSeen: seen }),
          setIsV4HookPoolsEnabled: (enabled: boolean): void => set({ isV4HookPoolsEnabled: enabled }),
          toggleProtocol: (protocol: FrontendSupportedProtocol): void => {
            const { selectedProtocols } = get()
            if (selectedProtocols.includes(protocol)) {
              set({ selectedProtocols: selectedProtocols.filter((p: FrontendSupportedProtocol) => p !== protocol) })
            } else {
              set({ selectedProtocols: [...selectedProtocols, protocol] })
            }
          },
        },
      })),
      {
        name: 'useTransactionSettingsStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  // Set up logging subscription
  const unsubscribe = store.subscribe(
    (state) => state,
    (state) => {
      logContextUpdate('TransactionSettings', state)
    },
  )

  const cleanup = (): void => {
    unsubscribe()
  }

  return { store, cleanup }
}
