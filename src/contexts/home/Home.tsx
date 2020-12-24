import React, { ReactNode, useCallback, useEffect, useState } from 'react'

import Context from './context'
import { Home as HOME_DEX } from './types'

const NAME_FOR_DEX: { [key: string]: string } = {
  UNISWAP_DEX: 'Uniswap',
  COMPOUND_DEX: 'Compound',
  SUSHISWAP_DEX: 'Sushiswap'
}

const ICON_FOR_DEX: { [key: string]: string } = {
  UNISWAP_DEX: '🦄',
  COMPOUND_DEX: '👨‍🌾',
  SUSHISWAP_DEX: '🍣'
}

const HOME_FOR_DEX: { [key: string]: string } = {
  UNISWAP_DEX: '/swap',
  COMPOUND_DEX: '/lending',
  SUSHISWAP_DEX: '/swap'
}

const SORT_FOR_DEX: { [key: string]: number } = {
  UNISWAP_DEX: 1,
  COMPOUND_DEX: 2,
  SUSHISWAP_DEX: 3
}

const DESCRIPTION_FOR_DEX: { [key: string]: string } = {
  UNISWAP_DEX: 'Uniswap is a decentralized cryptocurrency exchange which through use of smart contracts.',
  COMPOUND_DEX: 'Compound supply or borrow assets from the protocol, and participate in community governance.',
  SUSHISWAP_DEX: 'SushiSwap is an automated market making decentralized exchange currently on the Ethereum blockchain.'
}

const HIGHLIGHT_FOR_DEX: { [key: string]: boolean } = {
  UNISWAP_DEX: false,
  COMPOUND_DEX: false,
  SUSHISWAP_DEX: false
}

export default function Home({ children }: { children: ReactNode }) {
  const [home, setHome] = useState<HOME_DEX[]>([])

  const fetchDexList = useCallback(() => {
    const homeArr: HOME_DEX[] = []
    const dexKeys = Object.keys(NAME_FOR_DEX)

    for (let i = 0; i < dexKeys.length; i++) {
      const dexKey = dexKeys[i]
      const tokenKey = dexKey.replace('_DEX', '').toLowerCase()

      try {
        homeArr.push({
          name: NAME_FOR_DEX[dexKey],
          icon: ICON_FOR_DEX[dexKey],
          home: HOME_FOR_DEX[dexKey],
          id: tokenKey,
          sort: SORT_FOR_DEX[dexKey],
          description: DESCRIPTION_FOR_DEX[dexKey],
          highlight: HIGHLIGHT_FOR_DEX[dexKey]
        })
      } catch (e) {
        console.log(e)
      }
    }
    homeArr.sort((a, b) => (a.sort < b.sort ? 1 : -1))
    setHome(homeArr)
  }, [setHome])

  useEffect(() => {
    fetchDexList()
  }, [fetchDexList])
  return (
    <Context.Provider
      value={{
        home
      }}
    >
      {children}
    </Context.Provider>
  )
}
