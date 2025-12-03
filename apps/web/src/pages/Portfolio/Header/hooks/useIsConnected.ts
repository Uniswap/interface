/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'

export default function useIsConnected(): boolean {
  const { evmAddress, svmAddress } = useActiveAddresses()
  return Boolean(evmAddress || svmAddress)
}
