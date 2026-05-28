import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useActiveWallet } from '~/features/accounts/store/hooks'

export function useIsEmbeddedWallet(): boolean {
  const activeEVMWallet = useActiveWallet(Platform.EVM)
  return activeEVMWallet?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
}
