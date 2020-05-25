import * as ethers from 'ethers'

export default class UncheckedJsonRpcSigner extends ethers.Signer {
  constructor(signer) {
    super()
    ethers.utils.defineReadOnly(this, 'signer', signer)
    ethers.utils.defineReadOnly(this, 'provider', signer.provider)
  }

  getAddress() {
    return this.signer.getAddress()
  }

  sendTransaction(transaction) {
    return this.signer.sendUncheckedTransaction(transaction).then(hash => {
      return {
        hash: hash,
        nonce: null,
        gasLimit: null,
        gasPrice: null,
        data: null,
        value: null,
        chainId: null,
        confirmations: 0,
        from: null,
        wait: confirmations => {
          return this.signer.provider.waitForTransaction(hash, confirmations)
        }
      }
    })
  }

  signMessage(message) {
    return this.signer.signMessage(message)
  }

  signTypedMessage(data) {
    return this.signer.getAddress()
      .then(address => {
        if (typeof this.signer.provider?.provider?.enable === 'function') {
          return this.signer.provider.provider.enable().then(() => address)
        } else if (typeof this.signer.provider?.provider?.unlock === 'function') {
          return this.signer.provider.provider.unlock().then(() => address)
        } else {
          return Promise.resolve(address)
        }
      })
      .then(address => {
          return new Promise((respond, reject) => {
            this.signer.provider.provider.sendAsync({
              method: 'eth_signTypedData_v3',
              params: [address, JSON.stringify(data)],
              from: address
            }, function(err, result) {
              if (err || result.error) reject(err || result.error.message)
              else respond(result.result)
            })
          })
        }
      )
  }

}
