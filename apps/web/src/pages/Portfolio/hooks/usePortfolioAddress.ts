/* eslint-disable-next-line no-restricted-imports, no-restricted-syntax */
import { useAccount } from 'hooks/useAccount'

// This is the address used for the disconnected demo view.  It is only used in the disconnected state for the portfolio page.
const DEMO_WALLET_ADDRESS = '0x8796207d877194d97a2c360c041f13887896FC79'

export function usePortfolioAddress() {
  const account = useAccount()
  if (!account.address) {
    return DEMO_WALLET_ADDRESS
  }
  return account.address
}
