import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type MarketplaceOption = { name: string; icon: string }

interface State {
  options: MarketplaceOption[]
  select: (o: MarketplaceOption) => void
}

export const useMarketplaceSelect = create<State>()(
  devtools(
    (set) => ({
      options: [],
      select: (option) =>
        set(({ options }) => {
          if (options.find((o) => option.name === o.name))
            return { options: options.filter((x) => x.name !== option.name) }
          else return { options: [...options, option] }
        }),
    }),
    { name: 'useMarketplaceSelect' }
  )
)
