import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface CartState {
  cartExpanded: boolean
  toggleCart: () => void
}

export const useCart = create<CartState>()(
  devtools(
    (set) => ({
      cartExpanded: false,
      toggleCart: () =>
        set(({ cartExpanded }) => ({
          cartExpanded: !cartExpanded,
        })),
    }),
    { name: 'useCart' }
  )
)
