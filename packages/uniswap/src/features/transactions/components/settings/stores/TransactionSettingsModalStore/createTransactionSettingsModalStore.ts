import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export enum TransactionSettingsModalId {
  TransactionSettings = 'transactionSettings',
  ViewOnly = 'viewOnly',
  SlippageWarning = 'slippageWarning',
}

// Base modal IDs that are always available
export type BaseModalId = TransactionSettingsModalId.TransactionSettings | TransactionSettingsModalId.ViewOnly

// Generic type that allows extending with custom modal IDs
export type ModalId<T extends TransactionSettingsModalId> = BaseModalId | T
export type ModalIdWithSlippage = ModalId<TransactionSettingsModalId.SlippageWarning>

export type ModalState = {
  isVisible: boolean
  readonly show: () => void
  readonly hide: () => void
}

// All modals are stored in a single object
type Modals<T extends TransactionSettingsModalId> = Record<ModalId<T>, ModalState>

// The store state interface
export interface TransactionSettingsModalState<T extends TransactionSettingsModalId> {
  modals: Modals<T>
  registerModal: (modalId: ModalId<T>) => void
}

// Helper function to create modal state with proper show/hide functions
const createModalState = <T extends TransactionSettingsModalId>(
  modalId: ModalId<T>,
  set: (
    partial:
      | Partial<TransactionSettingsModalState<T>>
      | ((state: TransactionSettingsModalState<T>) => Partial<TransactionSettingsModalState<T>>),
  ) => void,
): ModalState => ({
  isVisible: false,
  show: (): void => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: { ...state.modals[modalId], isVisible: true },
      },
    }))
  },
  hide: (): void => {
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: { ...state.modals[modalId], isVisible: false },
      },
    }))
  },
})

export const createTransactionSettingsModalStore = <T extends TransactionSettingsModalId>(
  modalIds: ModalId<T>[],
): StoreApi<TransactionSettingsModalState<T>> => {
  return create<TransactionSettingsModalState<T>>()(
    devtools(
      (set) => {
        const allModalIds: ModalId<T>[] = [
          TransactionSettingsModalId.TransactionSettings,
          TransactionSettingsModalId.ViewOnly,
          ...modalIds,
        ]

        const modals = allModalIds.reduce(
          (acc, next) => {
            acc[next] = createModalState(next, set)
            return acc
          },
          {} as Modals<T>,
        )

        return {
          modals,
          registerModal: (modalId: ModalId<T>): void => {
            set(
              (currentState) => ({
                modals: {
                  ...currentState.modals,
                  [modalId]: createModalState(modalId, set),
                },
              }),
              false,
              'registerModal',
            )
          },
        }
      },
      {
        name: 'useTransactionSettingsModalStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )
}
