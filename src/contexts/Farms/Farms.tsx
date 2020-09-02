import React, { useCallback, useEffect, useState } from 'react'

import Context from './context'
import { Farm } from './types'

const NAME_FOR_POOL: { [key: string]: string } = {
  YFI_DEX: 'YFI Farm',
  UNISWAP_DEX: 'Uniswap'
}

const ICON_FOR_POOL: { [key: string]: string } = {
  YFI_DEX: '🐋',
  UNISWAP_DEX: '🦄'
}

const SORT_FOR_POOL: { [key: string]: number } = {
  YFI_DEX: 0,
  UNISWAP_DEX: 1
}

// eslint-disable-next-line react/prop-types
const Farms: React.FC = ({ children }) => {
  const [farms, setFarms] = useState<Farm[]>([])

  const fetchDexList = useCallback(() => {
    const farmsArr: Farm[] = []
    const poolKeys = Object.keys(NAME_FOR_POOL)

    for (let i = 0; i < poolKeys.length; i++) {
      const poolKey = poolKeys[i]
      const tokenKey = poolKey.replace('_DEX', '').toLowerCase()

      try {
        farmsArr.push({
          name: NAME_FOR_POOL[poolKey],
          icon: ICON_FOR_POOL[poolKey],
          id: tokenKey,
          sort: SORT_FOR_POOL[poolKey]
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
