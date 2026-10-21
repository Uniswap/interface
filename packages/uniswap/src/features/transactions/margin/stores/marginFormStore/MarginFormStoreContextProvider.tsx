import { type PropsWithChildren, useState } from 'react'
import {
  createMarginFormStore,
  type MarginFormStore,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import type { MarginFormState } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/types'

export function MarginFormStoreContextProvider({
  children,
  initialState,
}: PropsWithChildren<{ initialState?: Partial<MarginFormState> }>): JSX.Element {
  // Per-provider store instance; state persists until the provider unmounts.
  const [store] = useState<MarginFormStore>(() => createMarginFormStore({ initialState }))

  return <MarginFormStoreContext.Provider value={store}>{children}</MarginFormStoreContext.Provider>
}
