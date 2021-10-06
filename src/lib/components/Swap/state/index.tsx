import { WritableAtom } from 'jotai'
import { atomWithStore } from 'jotai/redux'
import { createContext, ReactNode } from 'react'
import { AnyAction, createStore } from 'redux'

import reducer, { SwapState } from './reducer'

export const StoreAtomContext = createContext<WritableAtom<SwapState, AnyAction>>(undefined as any)

export function SwapStateProvider({ children }: { children: ReactNode }) {
  const store = createStore(reducer)
  const storeAtom = atomWithStore(store)

  return <StoreAtomContext.Provider value={storeAtom}>{children}</StoreAtomContext.Provider>
}
