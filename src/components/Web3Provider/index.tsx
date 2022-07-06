import { Web3ReactProvider } from '@web3-react/core'
import { ReactNode } from 'react'

import { useConnectors, useEagerlyConnect } from './hooks'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connectors = useConnectors()

  return <Web3ReactProvider connectors={connectors}>{children}</Web3ReactProvider>
}
