import type { CreateConnectorFn } from 'wagmi'
import { walletConnect } from 'wagmi/connectors'
import {
  INTERFACE_WC_STORAGE_PREFIX,
  UNISWAP_WALLET_WC_STORAGE_PREFIX,
  uniswapWalletConnect,
} from '~/connection/walletConnect'

vi.mock('wagmi/connectors', () => ({
  walletConnect: vi.fn(() => vi.fn(() => ({}))),
}))

// The generic interface connector (wagmiConfig.ts) and the Uniswap Wallet connector
// (walletConnect.ts) are two separate WC SignClients. Sharing a customStoragePrefix makes
// them share a relay identity, letting one client's subscription cleanup drop the other's
// active session (INC-316). Both call sites read these constants, so distinctness here is the
// invariant that keeps the two relay identities isolated.
describe('WalletConnect connector storage isolation', () => {
  it('keeps the two web WC connectors on distinct storage prefixes', () => {
    expect(UNISWAP_WALLET_WC_STORAGE_PREFIX).toBeTruthy()
    expect(INTERFACE_WC_STORAGE_PREFIX).toBeTruthy()
    expect(UNISWAP_WALLET_WC_STORAGE_PREFIX).not.toBe(INTERFACE_WC_STORAGE_PREFIX)
  })

  it('constructs the Uniswap Wallet connector with its isolated storage prefix', () => {
    vi.mocked(walletConnect).mockClear()

    const connectorFn = uniswapWalletConnect()
    // createConnector is identity in wagmi; invoking the fn runs the inner walletConnect() call.
    const config = { emitter: { on: vi.fn() } } as unknown as Parameters<CreateConnectorFn>[0]
    connectorFn(config)

    expect(walletConnect).toHaveBeenCalledWith(
      expect.objectContaining({ customStoragePrefix: UNISWAP_WALLET_WC_STORAGE_PREFIX }),
    )
  })
})
