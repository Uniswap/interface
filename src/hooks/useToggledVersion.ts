import {SupportedChainId} from '../constants/chains'
import { useActiveWeb3React } from './web3'
import useParsedQueryString from './useParsedQueryString'
export enum Version {
  v2 = 'V2',
  v3 = 'V3',
}

export const DEFAULT_VERSION: Version = Version.v2

export default function useToggledVersion(): Version {
  const { chainId } = useActiveWeb3React()
  const { use } = useParsedQueryString()
  if (typeof use !== 'string') {
    return chainId && chainId === 1 ? 
      DEFAULT_VERSION 
      : chainId === SupportedChainId.ARBITRUM_ONE 
      ? Version.v3 
      : DEFAULT_VERSION
  }
  switch (use.toLowerCase()) {
    case 'v2':
      return Version.v2
    case 'v3':
      return Version.v3
    default:
      return Version.v2
  }
}
