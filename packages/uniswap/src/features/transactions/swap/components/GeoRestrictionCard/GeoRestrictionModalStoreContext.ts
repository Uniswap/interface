import { createContext } from 'react'
import type { GeoRestrictionModalStore } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/createGeoRestrictionModalStore'

export const GeoRestrictionModalStoreContext = createContext<GeoRestrictionModalStore | null>(null)
