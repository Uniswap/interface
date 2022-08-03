import create from 'zustand'
import { devtools } from 'zustand/middleware'

type cartState = {
  cartExpanded: boolean
  toggleCart: () => void
}

export const useCart = create<cartState>()(
  devtools(
    (set) => ({
      cartExpanded: false,
      toggleCart: () =>
        set(({ cartExpanded }) => ({
          cartExpanded: !cartExpanded,
        })),
    }),
    { name: 'use_cart' }
  )
)
