import { useWeb3React, Web3ReactProvider } from '@web3-react/core'

export default function useActiveWeb3React() {
  const interfaceContext = useWeb3React<Web3ReactProvider>()
  return interfaceContext
}
