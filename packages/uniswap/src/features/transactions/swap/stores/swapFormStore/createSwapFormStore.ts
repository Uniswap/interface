import type { MutableRefObject } from 'react'
import { createRef } from 'react'
import type { Dispatch } from 'redux'
import { updateFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/slice'
import type {
  SwapFormState,
  SwapFormStateForConsumers,
  SwapFormStoreState,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isDevEnv } from 'utilities/src/environment/env'
import { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'

export const INITIAL_SWAP_FORM_STATE: SwapFormState = {
  exactAmountFiat: undefined,
  exactAmountToken: '',
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: undefined,
  filteredChainIds: undefined,
  input: undefined,
  output: undefined,
  selectingCurrencyField: undefined,
  isSelectingCurrencyFieldPrefilled: undefined,
  txId: undefined,
  txHash: undefined,
  txHashReceivedTime: undefined,
  isFiatMode: false,
  isMax: false,
  presetPercentage: undefined,
  preselectAsset: undefined,
  isSubmitting: false,
  isConfirmed: false,
  showPendingUI: false,
  instantReceiptFetchTime: undefined,
  instantOutputAmountRaw: undefined,
}

export type SwapFormStore = UseBoundStore<StoreApi<SwapFormStoreState>>

export const createSwapFormStore = ({
  hideFooter,
  hideSettings,
  initialState,
  derivedSwapInfo,
  dependenciesForSideEffect: { dispatch },
}: {
  hideFooter?: boolean
  hideSettings?: boolean
  initialState?: SwapFormState
  derivedSwapInfo: DerivedSwapInfo
  dependenciesForSideEffect: {
    dispatch: Dispatch
  }
}): {
  store: SwapFormStore
  cleanup: () => void
} => {
  const store = create<SwapFormStoreState>()(
    devtools(
      subscribeWithSelector((set) => {
        const amountUpdatedTimeRef = createRef<number>() as MutableRefObject<number>
        const exactAmountFiatRef = createRef<string>() as MutableRefObject<string>
        const exactAmountTokenRef = createRef<string>() as MutableRefObject<string>

        amountUpdatedTimeRef.current = 0
        exactAmountFiatRef.current = ''
        exactAmountTokenRef.current = ''

        return {
          exactAmountFiat: undefined,
          exactAmountToken: '',
          exactCurrencyField: CurrencyField.INPUT,
          focusOnCurrencyField: undefined,
          filteredChainIds: undefined,
          input: undefined,
          output: undefined,
          instantReceiptFetchTime: undefined,
          selectingCurrencyField: undefined,
          isSelectingCurrencyFieldPrefilled: undefined,
          txId: undefined,
          txHash: undefined,
          txHashReceivedTime: undefined,
          isFiatMode: false,
          isMax: false,
          presetPercentage: undefined,
          preselectAsset: undefined,
          isSubmitting: false,
          showPendingUI: false,
          isConfirmed: false,
          instantOutputAmountRaw: undefined,
          hideFooter,
          hideSettings,
          prefilledCurrencies: undefined,
          isPrefilled: undefined,
          derivedSwapInfo,
          amountUpdatedTimeRef,
          exactAmountFiatRef,
          exactAmountTokenRef,
          updateSwapForm: (newState: Partial<Omit<SwapFormState, 'updateSwapForm'>>): void => {
            set((state) => ({ ...state, ...newState }))
          },
          ...initialState,
          actions: {
            // This is the same as `setSwapForm` in the locally-managed state (via `useState) from the previous Context-driven version of this state management solution
            setSwapFormState: (newState: Partial<SwapFormStateForConsumers>): void => {
              set((state) => ({ ...state, ...newState }))
            },
            // This is responsible for updating the function, `updateSwapForm`, that consumers use to update the store and its state
            setUpdateSwapForm: (newUpdateSwapForm: (newState: Partial<SwapFormState>) => void): void => {
              set((state) => {
                return {
                  ...state,
                  updateSwapForm: newUpdateSwapForm,
                }
              })
            },
          },
        }
      }),
      {
        name: 'useSwapFormStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )

  // `store.subscribe` is used for observing store state changes, such as logging, triggering side effects, or integrating with external systems
  const unsubscribe1 = store.subscribe(
    (state) => state.filteredChainIds,
    (filteredChainIds) => {
      // Update chainFilter redux state if swap form update includes a change to filteredChainIds
      if (filteredChainIds) {
        dispatch(updateFilteredChainIds({ filteredChainIds }))
      }
    },
    {
      equalityFn: shallow,
    },
  )

  const unsubscribe2 = store.subscribe(
    (state) => state,
    (state) => {
      // TODO: Decide how to migrate this. Do we want to continue to log this as a context update? If so, should we change the name? If not, do we want to create a store logger?
      logContextUpdate('SwapFormContext', state)
    },
  )

  const cleanup = (): void => {
    unsubscribe1()
    unsubscribe2()
  }

  return { store, cleanup }
}
