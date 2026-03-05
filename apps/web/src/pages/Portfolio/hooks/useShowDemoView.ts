/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'

/**
 * Returns true when the user should see the demo/disconnected portfolio view.
 * This happens when:
 * - User is not connected to any wallet
 * - AND user is not viewing an external wallet address via URL
 */
export function useShowDemoView(): boolean {
  const { evmAddress, svmAddress } = useActiveAddresses()
  const { isExternalWallet } = usePortfolioRoutes()

  const isConnected = Boolean(evmAddress || svmAddress)

  return !isConnected && !isExternalWallet
}
