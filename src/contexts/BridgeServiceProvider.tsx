import React, { useState, useEffect, useContext } from 'react'

import store from '../state'
import { useBridge } from './BridgeProvider'
import { useActiveWeb3React } from '../hooks'
import { BridgeService } from '../services/BridgeService'

const defaultValue: BridgeService | null = null

export const BridgeServiceContext = React.createContext<BridgeService | null>(defaultValue)

export const BridgeServiceProvider = ({ children }: { children?: React.ReactNode }) => {
  const [bridgeService, setBridgeService] = useState<BridgeService | null>(null)

  const { bridge } = useBridge()
  const { account } = useActiveWeb3React()

  useEffect(() => {
    setBridgeService(bridge && account ? new BridgeService(bridge, store, account) : null)
  }, [account, bridge])

  return <BridgeServiceContext.Provider value={bridgeService}>{children}</BridgeServiceContext.Provider>
}

export const useBridgeService = () => {
  return useContext(BridgeServiceContext)
}
