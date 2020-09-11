// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { _Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'

// never send real ether to this, obviously
const PRIVATE_KEY_TEST_NEVER_USE = '0xec418fc03915685a633a934a776973697313725230e5b0d3f1c39b02077c70e7'

// address of the above key
export const TEST_ADDRESS_NEVER_USE = '0x8F37B3A899d5C8479954d390003Bcd754C03cBb4'

export const TEST_ADDRESS_NEVER_USE_SHORTENED = '0x8F37...cBb4'

class CustomizedBridge extends _Eip1193Bridge {
  async sendAsync(...args) {
    console.debug('sendAsync called', ...args)
    return this.send(...args)
  }
  async send(...args) {
    console.debug('send called', ...args)
    const isCallbackForm = typeof args[0] === 'object' && typeof args[1] === 'function'
    let callback
    let method
    let params
    if (isCallbackForm) {
      callback = args[1]
      method = args[0].method
      params = args[0].params
    } else {
      method = args[0]
      params = args[1]
    }
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
      if (isCallbackForm) {
        callback({ result: [TEST_ADDRESS_NEVER_USE] })
      } else {
        return Promise.resolve([TEST_ADDRESS_NEVER_USE])
      }
    }
    //Update here for chain id as well
    if (method === 'eth_chainId') {
      if (isCallbackForm) {
        callback(null, { result: '0x3' })
      } else {
        return Promise.resolve('0x3')
      }
    }
    try {
      const result = await super.send(method, params)
      console.debug('result received', method, params, result)
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
  return original(url.startsWith('/') && url.length > 2 && !url.startsWith('/#') ? `/#${url}` : url, {
    ...options,
    onBeforeLoad(win) {
      options && options.onBeforeLoad && options.onBeforeLoad(win)
      win.localStorage.clear()
      const provider = new JsonRpcProvider('https://ropsten.infura.io/v3/83658839196943e3b2119f093b11ee0b', 3)
      const signer = new Wallet(PRIVATE_KEY_TEST_NEVER_USE, provider)
      win.ethereum = new CustomizedBridge(signer, provider)
    }
  })
})
