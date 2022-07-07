import { Web3ReactProvider } from '@web3-react/core'
import useConnectors from 'hooks/useConnectors'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import { ReactNode } from 'react'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connectors = useConnectors()

  return <Web3ReactProvider connectors={connectors}>{children}</Web3ReactProvider>
}
