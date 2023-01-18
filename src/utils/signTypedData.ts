import { _TypedDataEncoder } from '@ethersproject/hash'
import { JsonRpcSigner } from '@ethersproject/providers'

/**
 * Overrides the _signTypedData method to add support for wallets without EIP-712 support (eg Zerion).
 * Adds a fallback to eth_sign.
 */
JsonRpcSigner.prototype._signTypedData = async function signTypedDataWithFallbacks(this, domain, types, value) {
  // Populate any ENS names (in-place)
  const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
    return this.provider.resolveName(name) as Promise<string>
  })

  const address = (await this.getAddress()).toLowerCase()
  const payload = JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value))

  return this.provider
    .send('eth_signTypedData_v4', [address, payload])
    .catch((e) => {
      if ('message' in e && e.message.match(/not found/i)) {
        console.warn('eth_signTypedData_v4 failed, falling back to eth_sign:', e)
        const hash = _TypedDataEncoder.hash(populated.domain, types, populated.value)
        return this.provider.send('eth_sign', [address, hash])
      }
      throw e
    })
    .catch((e) => {
      console.warn('eth_sign failed:', e)
      throw e
    })
}
