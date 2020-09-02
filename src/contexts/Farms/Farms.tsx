import React, { useCallback, useEffect, useState } from 'react'

import Context from './context'
import { Farm } from './types'

const NAME_FOR_DEX: { [key: string]: string } = {
  YFI_DEX: 'YFI Farm',
  UNISWAP_DEX: 'Uniswap'
}

const ICON_FOR_DEX: { [key: string]: string } = {
  YFI_DEX: '🐋',
  UNISWAP_DEX: '🦄'
}

const HOME_FOR_DEX: { [key: string]: string } = {
  YFI_DEX: '/',
  UNISWAP_DEX: '/swap'
}

const SORT_FOR_DEX: { [key: string]: number } = {
  YFI_DEX: 0,
  UNISWAP_DEX: 1
}

const HIGHLIGHT_FOR_DEX: { [key: string]: boolean } = {
  YFI_DEX: false,
  UNISWAP_DEX: true
}

// eslint-disable-next-line react/prop-types
const Farms: React.FC = ({ children }) => {
  const [farms, setFarms] = useState<Farm[]>([])

  const fetchDexList = useCallback(() => {
    const farmsArr: Farm[] = []
    const dexKeys = Object.keys(NAME_FOR_DEX)

    for (let i = 0; i < dexKeys.length; i++) {
      const dexKey = dexKeys[i]
      const tokenKey = dexKey.replace('_DEX', '').toLowerCase()

      try {
        farmsArr.push({
          name: NAME_FOR_DEX[dexKey],
          icon: ICON_FOR_DEX[dexKey],
          home: HOME_FOR_DEX[dexKey],
          id: tokenKey,
          sort: SORT_FOR_DEX[dexKey],
          highlight: HIGHLIGHT_FOR_DEX[dexKey]
        })
      } catch (e) {
        console.log(e)
      }
    }
    farmsArr.sort((a, b) => (a.sort < b.sort ? 1 : -1))
    setFarms(farmsArr)
  }, [setFarms])

  useEffect(() => {
    fetchDexList()
  }, [fetchDexList])
  return (
    <Context.Provider
      value={{
        farms
      }}
    >
      {children}
    </Context.Provider>
  )
}

export default Farms
