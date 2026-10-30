import { isDevEnv } from '@universe/environment'
import type {
  MarginFormState,
  MarginFormStoreState,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/types'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { create } from 'zustand'
import type { StoreApi, UseBoundStore } from 'zustand'
import { devtools } from 'zustand/middleware'

export type MarginFormStore = UseBoundStore<StoreApi<MarginFormStoreState>>

export const DEFAULT_MARGIN_FORM_STATE: MarginFormState = {
  // Ordered collateral→debt key (lowercased WETH-USDC); keep in sync with DEFAULT_MARGIN_PAIR_KEY /
  // marginPairKey.
  pairKey: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  side: MarginDirection.LONG,
  marginAmount: '',
  leverage: 2,
  isSubmitting: false,
  paymentToken: undefined,
  selectingPaymentToken: false,
  slippageToleranceBps: 50,
  excludedVenues: [],
  activePlanId: undefined,
}

export function createMarginFormStore({ initialState }: { initialState?: Partial<MarginFormState> }): MarginFormStore {
  return create<MarginFormStoreState>()(
    devtools(
      (set, get) => ({
        ...DEFAULT_MARGIN_FORM_STATE,
        ...initialState,
        actions: {
          setMarginFormState: (newState): void => {
            set((state) => ({ ...state, ...newState }))
          },
          toggleVenue: (venue): void => {
            const { excludedVenues } = get()
            set({
              excludedVenues: excludedVenues.includes(venue)
                ? excludedVenues.filter((excluded) => excluded !== venue)
                : [...excludedVenues, venue],
            })
          },
          resetVenues: (): void => {
            set({ excludedVenues: [] })
          },
          reset: (): void => {
            set((state) => ({ ...state, ...DEFAULT_MARGIN_FORM_STATE }))
          },
        },
      }),
      { name: 'useMarginFormStore', enabled: isDevEnv() },
    ),
  )
}
