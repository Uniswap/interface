import type { EthersSignTypedDataParams } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'
import { signTypedData as chainsSignTypedData } from '~/chains'
import { getWalletMeta, WalletType } from '~/utils/walletMeta'

// Web's wrapper holds an ethers JsonRpcSigner (produced by `useEthersSigner`),
// so callers pass the ethers params shape; the wrapper layers in the WC-peer
// `supportsV4` detection and the eth_sign-fallback warn log.
type WebSignTypedDataParams = Omit<EthersSignTypedDataParams, 'method' | 'onFallback'>

// These are WalletConnect peers which do not implement eth_signTypedData_v4,
// but *do* implement eth_signTypedData. They are special-cased so that
// signing will still use EIP-712 (which is safer for the user).
const WC_PEERS_LACKING_V4_SUPPORT = ['SafePal Wallet', 'Ledger Wallet Connect']

/**
 * Assumes v4 support by default, except for known wallets.
 */
function supportsV4(signer: WebSignTypedDataParams['signer']): boolean {
  const meta = getWalletMeta(signer.provider)
  if (meta) {
    const { type, name } = meta
    if (name) {
      if (type === WalletType.WALLET_CONNECT && name && WC_PEERS_LACKING_V4_SUPPORT.includes(name)) {
        return false
      }
    }
  }

  return true
}

/**
 * Signs TypedData with EIP-712, if available, or else by falling
 * back to eth_sign. Calls eth_signTypedData_v4, or eth_signTypedData
 * for wallets with incomplete EIP-712 support.
 */
export async function signTypedData(params: WebSignTypedDataParams): Promise<string> {
  const method = supportsV4(params.signer) ? 'eth_signTypedData_v4' : 'eth_signTypedData'
  return chainsSignTypedData({
    ...params,
    method,
    onFallback: (error: unknown) => {
      logger.warn(
        'signing',
        'signTypedData',
        'signTypedData: wallet does not implement EIP-712, falling back to eth_sign',
        error,
      )
    },
  })
}
