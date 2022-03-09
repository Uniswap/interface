//Adding additional network, switching networks, accepting to switch and add network

describe('SWAP - Wrapp functionality', () => {
  before(() => {
    cy.addMetamaskNetwork({
      networkName: 'Arbitrum One',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      chainId: '42161',
      symbol: 'AETH',
      blockExplorer: 'https://arbiscan.io',
      isTestnet: false
    }).changeMetamaskNetwork('rinkeby')

    cy.visit('/')
      .get('#connect-wallet')
      .click()
      .get('#connect-METAMASK')
      .click()
      .acceptMetamaskAccess()
  })

  after(() => {
    cy.changeMetamaskNetwork('rinkeby')
    cy.disconnectMetamaskWalletFromAllDapps()
  })

  it('should switch network to mainet by SWAPR', () => {
    cy.findByTestId('network-switcher').click()
    cy.findByTestId('ethereum-network-button')
      .click()
      .allowMetamaskToSwitchNetwork()
    cy.findByTestId('network-switcher').should('contain.text', 'Ethereum')
    cy.wait(5000)
  })

  it('should add and switch network to gnosis', () => {
    cy.findByTestId('network-switcher').click()
    cy.findByTestId('gnosis-chain-network-button')
      .click()
      .allowMetamaskToAddAndSwitchNetwork()
    cy.findByTestId('network-switcher').should('contain.text', 'Gnosis')
    cy.wait(5000)
  })

  it('should switch network to Arbitrum', () => {
    cy.changeMetamaskNetwork('Arbitrum One')
    cy.findByTestId('network-switcher').should('contain.text', 'Arbitrum One')
    cy.wait(5000)
  })
})
