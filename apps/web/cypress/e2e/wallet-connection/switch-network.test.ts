import { createDeferredPromise } from '../../../src/test-utils/promise'
import { getTestSelector } from '../../utils'

function waitsForActiveChain(chain: string) {
  cy.get(getTestSelector('chain-selector-logo')).find('title').should('include.text', `${chain} logo`)
}

function switchChain(chain: string) {
  cy.get(getTestSelector('chain-selector')).eq(1).click()
  cy.contains(chain).click()
}

describe('network switching', () => {
  beforeEach(() => {
    cy.visit('/swap')
    cy.get(getTestSelector('web3-status-connected'))
  })

  function rejectsNetworkSwitchWith(rejection: unknown) {
    cy.hardhat().then((hardhat) => {
      // Reject network switch
      const sendStub = cy.stub(hardhat.provider, 'send').log(false).as('switch')
      sendStub.withArgs('wallet_switchEthereumChain').rejects(rejection)
      sendStub.callThrough() // allows other calls to return non-stubbed values
    })

    switchChain('Polygon')

    // Verify rejected network switch
    cy.get('@switch').should('have.been.calledWith', 'wallet_switchEthereumChain')
    waitsForActiveChain('Ethereum')
    cy.get(getTestSelector('web3-status-connected'))
  }

  it('should not display message on user rejection', () => {
    const USER_REJECTION = { code: 4001 }
    rejectsNetworkSwitchWith(USER_REJECTION)
    cy.get(getTestSelector('popups')).should('not.contain', 'Failed to switch networks')
  })

  it('should display message on unknown error', () => {
    rejectsNetworkSwitchWith(new Error('Unknown error'))
    cy.get(getTestSelector('popups')).contains('Failed to switch networks')
  })

  it('should add missing chain', () => {
    cy.hardhat().then((hardhat) => {
      // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
      const CHAIN_NOT_ADDED = { code: 4902 } // missing message in useSelectChain

      // Reject network switch with CHAIN_NOT_ADDED
      const sendStub = cy.stub(hardhat.provider, 'send').log(false).as('switch')
      let added = false
      sendStub
        .withArgs('wallet_switchEthereumChain')
        .callsFake(() => (added ? Promise.resolve(null) : Promise.reject(CHAIN_NOT_ADDED)))
      sendStub.withArgs('wallet_addEthereumChain').callsFake(() => {
        added = true
        return Promise.resolve(null)
      })
      sendStub.callThrough() // allows other calls to return non-stubbed values
    })

    switchChain('Polygon')

    // Verify the network was added
    cy.get('@switch').should('have.been.calledWith', 'wallet_switchEthereumChain')
    cy.get('@switch').should('have.been.calledWith', 'wallet_addEthereumChain', [
      {
        blockExplorerUrls: ['https://polygonscan.com/'],
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
      },
    ])
  })

  it('should not disconnect while switching', () => {
    const promise = createDeferredPromise()

    cy.hardhat().then((hardhat) => {
      // Reject network switch with CHAIN_NOT_ADDED
      const sendStub = cy.stub(hardhat.provider, 'send').log(false).as('switch')
      sendStub.withArgs('wallet_switchEthereumChain').returns(promise)
      sendStub.callThrough() // allows other calls to return non-stubbed values
    })

    switchChain('Polygon')

    // Verify there is no disconnection
    cy.get('@switch').should('have.been.calledWith', 'wallet_switchEthereumChain')
    cy.contains('Connecting to Polygon')
    cy.get(getTestSelector('web3-status-connected')).should('be.disabled')
    promise.resolve()
  })

  it('should switch networks', () => {
    // Select an output currency
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.contains('USDC').click()

    // Populate input/output fields
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')

    // Switch network
    switchChain('Polygon')

    // Verify network switch
    cy.wait('@wallet_switchEthereumChain')
    waitsForActiveChain('Polygon')
    cy.get(getTestSelector('web3-status-connected'))
    cy.url().should('contain', 'chain=polygon')

    // Verify that the input/output fields were reset
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
    cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'MATIC')
    cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
    cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')
  })
})

describe('network switching from URL param', () => {
  it('should switch network from URL param', () => {
    cy.visit('/swap?chain=polygon')
    cy.get(getTestSelector('web3-status-connected'))
    cy.wait('@wallet_switchEthereumChain')
    waitsForActiveChain('Polygon')
  })

  it('should be able to switch network after loading from URL param', () => {
    cy.visit('/swap?chain=polygon')
    cy.get(getTestSelector('web3-status-connected'))
    cy.wait('@wallet_switchEthereumChain')
    waitsForActiveChain('Polygon')

    // switching to another chain clears query param
    switchChain('Ethereum')
    cy.wait('@wallet_switchEthereumChain')
    waitsForActiveChain('Ethereum')
    cy.url().should('not.contain', 'chain=polygon')
  })
})
