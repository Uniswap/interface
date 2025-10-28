/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */
import { useAccount } from 'hooks/useAccount'

export default function useIsConnected() {
  const account = useAccount()
  return !!account.address
}
