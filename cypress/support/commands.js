// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { _Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'

// never send real ether to this, obviously
const PRIVATE_KEY_TEST_NEVER_USE = '0x0123456789012345678901234567890123456789012345678901234567890123'

// address of the above key
export const TEST_ADDRESS = '0x14791697260E4c9A71f18484C9f997B308e59325'

class CustomizedBridge extends _Eip1193Bridge {
  async send(method, params) {
    const isCallbackForm = typeof method === 'object' && typeof params === 'function'
    let callback
    if (isCallbackForm) {
      callback = params
      method = method.method
      params = method.params
    }
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
      if (isCallbackForm) {
        callback({ result: [TEST_ADDRESS] })
      } else {
        return Promise.resolve([TEST_ADDRESS])
      }
    }
    if (method === 'eth_chainId') {
      if (isCallbackForm) {
        callback(null, { result: '0x4' })
      } else {
        return Promise.resolve('0x4')
      }
    }
    try {
      const result = await super.send(method, params)
      if (isCallbackForm) {
        callback(null, { result })
      } else {
        return result
      }
    } catch (error) {
      if (isCallbackForm) {
        callback(error, null)
      } else {
        throw error
      }
    }
  }
}

// sets up the injected provider to be a mock ethereum provider with the given mnemonic/index
Cypress.Commands.overwrite('visit', (original, url, options) => {
  return original(url, {
    ...options,
    onBeforeLoad(win) {
      options && options.onBeforeLoad && options.onBeforeLoad(win)
      const provider = new JsonRpcProvider('https://rinkeby.infura.io/v3/b8800ce81b8c451698081d269b86692b', 4)
      const signer = new Wallet(PRIVATE_KEY_TEST_NEVER_USE, provider)
      const bridge = new CustomizedBridge(signer, provider)
      win.ethereum = bridge
    }
  })
})
