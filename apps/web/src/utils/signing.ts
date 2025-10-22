import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import type { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { logger } from 'utilities/src/logger/logger'
import { getWalletMeta, WalletType } from 'utils/walletMeta'

// These are WalletConnect peers which do not implement eth_signTypedData_v4, but *do* implement eth_signTypedData.
// They are special-cased so that signing will still use EIP-712 (which is safer for the user).
const WC_PEERS_LACKING_V4_SUPPORT = ['SafePal Wallet', 'Ledger Wallet Connect']

// Assumes v4 support by default, except for known wallets.
function supportsV4(provider: JsonRpcProvider): boolean {
  const meta = getWalletMeta(provider)
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
 * Signs TypedData with EIP-712, if available, or else by falling back to eth_sign.
 * Calls eth_signTypedData_v4, or eth_signTypedData for wallets with incomplete EIP-712 support.
 *
 * @see https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/providers/src.ts/json-rpc-provider.ts#L334
 */
export async function signTypedData({
  signer,
  domain,
  types,
  value,
}: {
  signer: JsonRpcSigner
  domain: TypedDataDomain
  types: Record<string, TypedDataField[]>
  // Use Record<string, any> for the value to match the JsonRpcSigner._signTypedData signature.
  value: Record<string, any>
}) {
  // Populate any ENS names (in-place)
  const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
    return signer.provider.resolveName(name) as Promise<string>
  })

  const method = supportsV4(signer.provider) ? 'eth_signTypedData_v4' : 'eth_signTypedData'
  const address = (await signer.getAddress()).toLowerCase()
  const message = JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value))

  try {
    return await signer.provider.send(method, [address, message])
  } catch (error) {
    // If eth_signTypedData is unimplemented, fall back to eth_sign.
    if (
      typeof error.message === 'string' &&
      (error.message.match(/not (found|implemented)/i) ||
        error.message.match(/TrustWalletConnect.WCError error 1/) ||
        error.message.match(/Missing or invalid/))
    ) {
      logger.warn(
        'signing',
        'signTypedData',
        'signTypedData: wallet does not implement EIP-712, falling back to eth_sign',
        error,
      )
      const hash = _TypedDataEncoder.hash(populated.domain, types, populated.value)
      return await signer.provider.send('eth_sign', [address, hash])
    }
    throw error
  }
}
