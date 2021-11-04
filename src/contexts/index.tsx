import React from 'react'
import { BridgeProvider } from './BridgeProvider'
import { BridgeServiceProvider } from './BridgeServiceProvider'

export const BridgeProviders = ({ children }: { children?: React.ReactNode }) => {
  return (
    <BridgeProvider>
      <BridgeServiceProvider>{children}</BridgeServiceProvider>
    </BridgeProvider>
  )
}
