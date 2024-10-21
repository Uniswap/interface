import { getTestSelector, resetHardhatChain } from '../../utils'

// TODO(WEB-4923): Re-enable network switching tests when theres a non-UI way to switch networks
// function switchChain(chain: string) {
//   cy.get(getTestSelector('chain-selector')).click()
//   cy.contains(chain).click()
// }

describe('network switching', () => {
  beforeEach(() => {
    cy.visit('/swap')
    cy.get(getTestSelector('web3-status-connected'))
  })
  afterEach(resetHardhatChain)

  // function rejectsNetworkSwitchWith(rejection: unknown) {
  //   cy.hardhat().then((hardhat) => {
  //     // Reject network switch
  //     const sendStub = cy.stub(hardhat.provider, 'send').log(false).as('switch')
  //     sendStub.withArgs('wallet_switchEthereumChain').rejects(rejection)
  //     sendStub.callThrough() // allows other calls to return non-stubbed values
  //   })

  //   switchChain('Polygon')

  //   // Verify rejected network switch
  //   cy.get('@switch').should('have.been.calledWith', 'wallet_switchEthereumChain')
  //   cy.get(getTestSelector('web3-status-connected'))
  // }

  // it('should not display message on user rejection', () => {
  //   const USER_REJECTION = { code: 4001 }
  //   rejectsNetworkSwitchWith(USER_REJECTION)
  //   cy.get(getTestSelector('popups')).should('not.contain', 'Failed to switch networks')
  // })

  // it('should display message on unknown error', () => {
  //   rejectsNetworkSwitchWith(new Error('Unknown error'))
  //   cy.get(getTestSelector('popups')).contains('Failed to switch networks')
  // })

  // it('should add missing chain', () => {
  //   cy.hardhat().then((hardhat) => {
  //     // https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods
  //     const CHAIN_NOT_ADDED = { code: 4902 } // missing message in useSelectChain

  //     // Reject network switch with CHAIN_NOT_ADDED
  //     const sendStub = cy.stub(hardhat.provider, 'send').log(false).as('switch')
  //     let added = false
  //     sendStub
  //       .withArgs('wallet_switchEthereumChain')
  //       .callsFake(() => (added ? Promise.resolve(null) : Promise.reject(CHAIN_NOT_ADDED)))
  //     sendStub.withArgs('wallet_addEthereumChain').callsFake(() => {
  //       added = true
  //       return Promise.resolve(null)
  //     })
  //     sendStub.callThrough() // allows other calls to return non-stubbed values
  //   })

  //   switchChain('Polygon')

  //   // Verify the network was added
  //   cy.get('@switch').should('have.been.calledWith', 'wallet_switchEthereumChain')
  //   cy.get('@switch').should('have.been.calledWith', 'wallet_addEthereumChain')
  // })

  // it('should not disconnect while switching', () => {
  //   // Defer the connection so we can see the pending state
  //   cy.hardhat().then((hardhat) => {
  //     const sendStub = cy.stub(hardhat.provider, 'send').log(false).as('switch')
  //     sendStub.withArgs('wallet_switchEthereumChain').returns(new Promise(() => {}))
  //     sendStub.callThrough() // allows other calls to return non-stubbed values
  //   })

  //   switchChain('Polygon')

  //   // Verify there is no disconnection
  //   cy.get('@switch').should('have.been.calledWith', 'wallet_switchEthereumChain')
  //   cy.contains('Connecting to Polygon')
  //   cy.get(getTestSelector('web3-status-connected')).should('be.disabled')
  // })

  // it('switches networks', () => {
  //   // Select an output currency
  //   cy.get('#swap-currency-output .open-currency-select-button').click()
  //   cy.get(getTestSelector('token-option-1-USDT')).click()

  //   // Populate input/output fields
  //   cy.get('#swap-currency-input .token-amount-input').clear().type('1')
  //   cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')

  //   // Switch network
  //   switchChain('Polygon')

  //   // Verify network switch
  //   cy.wait('@wallet_switchEthereumChain')
  //   cy.get(getTestSelector('web3-status-connected'))
  //   cy.url().should('contain', 'chain=polygon')

  //   // Verify that the input/output fields were reset
  //   cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
  //   cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'MATIC')
  //   cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
  //   cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'Select token')
  // })

  // describe('from URL param', () => {
  //   it('should switch network from URL param', () => {
  //     cy.visit('/swap?chain=optimism')
  //     cy.wait('@wallet_switchEthereumChain')
  //     cy.get(getTestSelector('web3-status-connected'))
  //   })

  //   it('should switch network with inputCurrency from URL param', () => {
  //     cy.visit('/swap?chain=optimism&outputCurrency=0x0b2c639c533813f4aa9d7837caf62653d097ff85')
  //     cy.wait('@wallet_switchEthereumChain')
  //     cy.get(getTestSelector('web3-status-connected'))
  //     cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'USDC')
  //   })

  //   it('should not switch network with no chain in param', () => {
  //     cy.hardhat().then((hardhat) => {
  //       cy.visit('/swap?outputCurrency=0x2260fac5e5542a773aa44fbcfedf7c193bc2c599')
  //       const sendSpy = cy.spy(hardhat.provider, 'send')
  //       cy.wrap(sendSpy).should('not.be.calledWith', 'wallet_switchEthereumChain')
  //       cy.wrap(hardhat.provider.network.chainId).should('eq', 1)
  //       cy.get(getTestSelector('web3-status-connected'))
  //       cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'WBTC')
  //     })
  //   })

  //   it('should be able to switch network after loading from URL param', () => {
  //     cy.visit('/swap?chain=optimism&outputCurrency=0x0b2c639c533813f4aa9d7837caf62653d097ff85')
  //     cy.wait('@wallet_switchEthereumChain')
  //     cy.get(getTestSelector('web3-status-connected'))
  //     cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'USDC')

  //     // switching to another chain clears query param
  //     switchChain('Ethereum')
  //     cy.wait('@wallet_switchEthereumChain')
  //     cy.url().should('not.contain', 'chain=optimism')
  //     cy.url().should('not.contain', 'outputCurrency=0xff970a61a04b1ca14834a43f5de4533ebddb5cc8')
  //   })
  // })

  describe('multichain', () => {
    it('does not switchEthereumChain when multichain is enabled', () => {
      cy.hardhat().then((hardhat) => {
        cy.visit('/swap')
        cy.get('#swap-currency-input .open-currency-select-button').click()
        cy.get(getTestSelector('chain-selector')).last().click()
        cy.contains('Arbitrum').click()
        const sendSpy = cy.spy(hardhat.provider, 'send')
        cy.wrap(sendSpy).should('not.be.calledWith', 'wallet_switchEthereumChain')
        cy.wrap(hardhat.provider.network.chainId).should('eq', 1)
      })
    })
  })
})
