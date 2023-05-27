import { getTestSelector } from '../../utils'

function getChainSelector(activeChain: string) {
  return cy.get(`${getTestSelector('chain-selector')} > [alt="${activeChain}"]`).eq(1)
}

describe('network switching', () => {
  beforeEach(() => {
    cy.visit('/swap', { ethereum: 'hardhat' })
  })

  it('should not display error on user rejection', () => {
    cy.hardhat().then((hardhat) => {
      const USER_REJECTION = { code: 4001 }

      // Reject network switch with USER_REJECTION
      const switchChainStub = cy.stub(hardhat.provider, 'send').log(false)
      switchChainStub.withArgs('wallet_switchEthereumChain').rejects(USER_REJECTION)
      switchChainStub.withArgs('wallet_addEthereumChain').resolves(null)
      switchChainStub.callThrough() // allows other calls to return non-stubbed values

      // Switch network
      getChainSelector('Ethereum').click()
      cy.contains('Polygon').click()

      // Verify rejected network switch
      getChainSelector('Ethereum')
      cy.get(getTestSelector('web3-status-connected'))
      cy.get(getTestSelector('popups')).should('not.contain', 'Failed to switch networks')
      cy.wrap(switchChainStub).should('have.been.calledWith', 'wallet_switchEthereumChain', [{ chainId: '0x89' }])
      cy.wrap(switchChainStub).should('not.have.been.calledWith', 'wallet_addEthereumChain')
    })
  })

  it.skip('should add missing chain', () => {
    cy.hardhat().then((hardhat) => {
      // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
      const CHAIN_NOT_ADDED = { code: 4902 } // missing message in useSelectChain

      // Reject network switch with CHAIN_NOT_ADDED
      const switchChainStub = cy.stub(hardhat.provider, 'send').log(false)
      switchChainStub.withArgs('wallet_switchEthereumChain').rejects(CHAIN_NOT_ADDED)
      switchChainStub.withArgs('wallet_addEthereumChain').resolves(null)
      switchChainStub.callThrough() // allows other calls to return non-stubbed values

      // Switch network
      getChainSelector('Ethereum').click()
      cy.contains('Polygon').click()

      // Verify the network was added
      cy.wrap(switchChainStub).should('have.been.calledWith', 'wallet_switchEthereumChain', [{ chainId: '0x89' }])
      cy.wrap(switchChainStub).should('have.been.calledWith', 'wallet_addEthereumChain', [
        {
          blockExplorerUrls: ['https://polygonscan.com/'],
          chainId: '0x89',
          chainName: 'Polygon',
          nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
          rpcUrls: ['https://polygon-rpc.com/'],
        },
      ])

      cy.then(() => switchChainStub.restore())
    })

    // Switch network
    getChainSelector('Ethereum').click()
    cy.contains('Polygon').click()

    // Verify network switch
    cy.wait('@wallet_switchEthereumChain')
    getChainSelector('Polygon')
    cy.get(getTestSelector('web3-status-connected'))
  })

  it('should display error on unknown error', () => {
    cy.hardhat().then((hardhat) => {
      // Reject network switch
      const switchChainStub = cy.stub(hardhat.provider, 'send').log(false)
      switchChainStub.withArgs('wallet_switchEthereumChain').rejects(new Error('Unknown error'))
      switchChainStub.withArgs('wallet_addEthereumChain').resolves(null)
      switchChainStub.callThrough() // allows other calls to return non-stubbed values

      // Switch network
      getChainSelector('Ethereum').click()
      cy.contains('Polygon').click()

      // Verify rejected network switch
      getChainSelector('Ethereum')
      cy.get(getTestSelector('web3-status')).contains('Error')
      cy.get(getTestSelector('popups')).contains('Failed to switch networks')
      cy.wrap(switchChainStub).should('have.been.calledWith', 'wallet_switchEthereumChain', [{ chainId: '0x89' }])
      cy.wrap(switchChainStub).should('not.have.been.calledWith', 'wallet_addEthereumChain')
    })
  })

  it.skip('should switch networks', () => {
    // Select an output currency
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.contains('USDC').click()

    // Populate input/output fields
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')

    // Switch network
    getChainSelector('Ethereum').click()
    cy.contains('Polygon').click()

    // Verify network switch
    cy.wait('@wallet_switchEthereumChain')
    getChainSelector('Polygon')
    cy.get(getTestSelector('web3-status-connected'))

    // Verify that the input/output fields were reset
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
    cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'MATIC')
    cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
    cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')
  })
})
