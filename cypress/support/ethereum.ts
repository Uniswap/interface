/**
 * Updates cy.visit() to include an injected window.ethereum provider.
 */

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import MetaMocks from 'metamocks'

// todo: figure out how env vars actually work in CI
// const TEST_PRIVATE_KEY = Cypress.env('INTEGRATION_TEST_PRIVATE_KEY')
const TEST_PRIVATE_KEY = '0xe580410d7c37d26c6ad1a837bbae46bc27f9066a466fb3a66e770523b4666d19'

// address of the above key
const TEST_ADDRESS_NEVER_USE = new Wallet(TEST_PRIVATE_KEY).address

export const injected = new MetaMocks(TEST_PRIVATE_KEY, 4)
