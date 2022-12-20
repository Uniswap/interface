/**
 * Updates cy.visit() to include an injected window.ethereum provider.
 */

import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

// todo: figure out how env vars actually work in CI
// const TEST_PRIVATE_KEY = Cypress.env('INTEGRATION_TEST_PRIVATE_KEY')
const TEST_PRIVATE_KEY = '0xe580410d7c37d26c6ad1a837bbae46bc27f9066a466fb3a66e770523b4666d19'

// address of the above key
const TEST_ADDRESS_NEVER_USE = new Wallet(TEST_PRIVATE_KEY).address

const provider = new JsonRpcProvider('https://goerli.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847', 4)
const signer = new Wallet(TEST_PRIVATE_KEY, provider)
export const injected = new (class extends Eip1193Bridge {
  chainId = /* GOERLI= */ 5

  async sendAsync(...args: any[]) {
    console.debug('sendAsync called', ...args)
    return this.send(...args)
  }
  async send(...args: any[]) {
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
    if (method === 'eth_chainId') {
      if (isCallbackForm) {
        callback(null, { result: '0x4' })
      } else {
        return Promise.resolve('0x4')
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
})(signer, provider)
