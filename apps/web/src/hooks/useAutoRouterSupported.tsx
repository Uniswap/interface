import { useAccount } from 'hooks/useAccount'

export default function useAutoRouterSupported(): boolean {
  const { chainId } = useAccount()
  return !!chainId
}
