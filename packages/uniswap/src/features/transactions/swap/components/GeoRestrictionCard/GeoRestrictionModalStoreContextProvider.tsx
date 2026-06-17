import { useState } from 'react'
import { createGeoRestrictionModalStore } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/createGeoRestrictionModalStore'
import { GeoRestrictionModalStoreContext } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionModalStoreContext'

export const GeoRestrictionModalStoreContextProvider = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode => {
  const [store] = useState(() => createGeoRestrictionModalStore())

  return <GeoRestrictionModalStoreContext.Provider value={store}>{children}</GeoRestrictionModalStoreContext.Provider>
}
