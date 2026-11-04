import { Platform } from '@universe/chains'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useActiveWallet } from '~/connection/accounts/hooks'

export function useIsEmbeddedWallet(): boolean {
  const activeEVMWallet = useActiveWallet(Platform.EVM)
  return activeEVMWallet?.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID
}
