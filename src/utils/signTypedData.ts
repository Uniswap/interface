import { _TypedDataEncoder } from '@ethersproject/hash'
import { JsonRpcSigner } from '@ethersproject/providers'

/**
 * Overrides the _signTypedData method to add support for wallets without EIP-712 support (eg Zerion),
 * by adding a fallback to eth_sign.
 * @see https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/providers/src.ts/json-rpc-provider.ts#L334
 */
JsonRpcSigner.prototype._signTypedData = async function signTypedDataWithFallbacks(this, domain, types, value) {
  // Populate any ENS names (in-place)
  const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
    return this.provider.resolveName(name) as Promise<string>
  })

  const address = (await this.getAddress()).toLowerCase()
  const payload = JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value))

  return this.provider.send('eth_signTypedData_v4', [address, payload]).catch((e) => {
    if (!('message' in e && e.message.match(/not found/i))) throw e

    console.warn('eth_signTypedData_v4 failed, falling back to eth_sign:', e)
    const hash = _TypedDataEncoder.hash(populated.domain, types, populated.value)
    return this.provider.send('eth_sign', [address, hash]).catch((e) => {
      console.warn('eth_sign failed:', e)
      throw e
    })
  })
}
