import { _TypedDataEncoder } from '@ethersproject/hash'
import { JsonRpcSigner } from '@ethersproject/providers'

/**
 * Overrides the _signTypedData method to add support for wallets without EIP-712 support (eg Zerion) by adding a fallback to eth_sign.
 * The implementation is copied from ethers (and linted), except for the catch statement, which removes the logger and adds the fallback.
 * @see https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/providers/src.ts/json-rpc-provider.ts#L334
 */
JsonRpcSigner.prototype._signTypedData = async function signTypedDataWithFallbacks(this, domain, types, value) {
  // Populate any ENS names (in-place)
  const populated = await _TypedDataEncoder.resolveNames(domain, types, value, (name: string) => {
    return this.provider.resolveName(name) as Promise<string>
  })

  const address = await this.getAddress()

  try {
    try {
      // We must try the unversioned eth_signTypedData first, because some wallets (eg SafePal) will hang on _v4.
      return await this.provider.send('eth_signTypedData', [
        address.toLowerCase(),
        JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value)),
      ])
    } catch (error) {
      // MetaMask complains that the unversioned eth_signTypedData is formatted incorrectly (32602) - it prefers _v4.
      if (error.code === -32602) {
        console.warn('eth_signTypedData failed, falling back to eth_signTypedData_v4:', error)
        return await this.provider.send('eth_signTypedData_v4', [
          address.toLowerCase(),
          JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, types, populated.value)),
        ])
      }
      throw error
    }
  } catch (error) {
    // If neither other method is available (eg Zerion), fallback to eth_sign.
    if (typeof error.message === 'string' && error.message.match(/not found/i)) {
      console.warn('eth_signTypedData_* failed, falling back to eth_sign:', error)
      const hash = _TypedDataEncoder.hash(populated.domain, types, populated.value)
      return await this.provider.send('eth_sign', [address, hash])
    }
    throw error
  }
}
