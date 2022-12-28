/**
 * Updates cy.visit() to include an injected window.ethereum provider.
 */

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'

import { SupportedChainId } from '../../src/constants/chains'
import MetaMocks from '../metamocks/index'

// todo: figure out how env vars actually work in CI
// const TEST_PRIVATE_KEY = Cypress.env('INTEGRATION_TEST_PRIVATE_KEY')
const TEST_PRIVATE_KEY = '0xe580410d7c37d26c6ad1a837bbae46bc27f9066a466fb3a66e770523b4666d19'

// address of the above key
const TEST_ADDRESS_NEVER_USE = new Wallet(TEST_PRIVATE_KEY).address

const provider = new JsonRpcProvider(`https://goerli.infura.io/v3/4bf032f2d38a4ed6bb975b80d6340847`)

export const injected = new MetaMocks(TEST_PRIVATE_KEY, SupportedChainId.GOERLI)
