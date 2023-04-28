describe('Token explore', () => {
  before(() => {
    cy.visit('/')
  })

  it('should load token leaderboard', () => {
    cy.visit('/tokens/ethereum')
    cy.get('[data-testid^=token-table]').its('length').should('be.greaterThan', 0)
    // check sorted svg icon is present in volume cell, since tokens are sorted by volume by default
    cy.getByTestId('header-row').getByTestId('volume-cell').find('svg').should('exist')
    cy.getByTestId('token-table-row-ETH').getByTestId('name-cell').should('include.text', 'Ether')
    cy.getByTestId('token-table-row-ETH').getByTestId('volume-cell').should('include.text', '$')
    cy.getByTestId('token-table-row-ETH').getByTestId('price-cell').should('include.text', '$')
    cy.getByTestId('token-table-row-ETH').getByTestId('tvl-cell').should('include.text', '$')
    cy.getByTestId('token-table-row-ETH').getByTestId('percent-change-cell').should('include.text', '%')
    cy.getByTestId('header-row').getByTestId('price-cell').click()
    cy.getByTestId('header-row').getByTestId('price-cell').find('svg').should('exist')
  })

  it('should update when time window toggled', () => {
    cy.visit('/tokens/ethereum')
    cy.getByTestId('time-selector').should('contain', '1D')
    cy.getByTestId('token-table-row-ETH')
      .getByTestId('volume-cell')
      .then(function ($elem) {
        cy.wrap($elem.text()).as('dailyEthVol')
      })
    cy.getByTestId('time-selector').click()
    cy.getByTestId('1Y').click()
    cy.getByTestId('token-table-row-ETH')
      .getByTestId('volume-cell')
      .then(function ($elem) {
        cy.wrap($elem.text()).as('yearlyEthVol')
      })
    expect(cy.get('@dailyEthVol')).to.not.equal(cy.get('@yearlyEthVol'))
  })

  it('should navigate to token detail page when row clicked', () => {
    cy.visit('/tokens/ethereum')
    cy.getByTestId('token-table-row-ETH').click()
    cy.getByTestId('token-details-about-section').should('exist')
    cy.getByTestId('token-details-stats').should('exist')
    cy.getByTestId('token-info-container').should('exist')
    cy.getByTestId('chart-container').should('exist')
    cy.contains('Ethereum is a smart contract platform that enables developers to build tokens').should('exist')
    cy.contains('Etherscan').should('exist')
  })

  it('should update when global network changed', () => {
    cy.visit('/tokens/ethereum')
    cy.getByTestId('tokens-network-filter-selected').should('contain', 'Ethereum')
    cy.getByTestId('token-table-row-ETH').should('exist')

    // note: cannot switch global chain via UI because we cannot approve the network switch
    // in metamask modal using plain cypress. this is a workaround.
    cy.visit('/tokens/polygon')
    cy.getByTestId('tokens-network-filter-selected').should('contain', 'Polygon')
    cy.getByTestId('token-table-row-MATIC').should('exist')
  })

  it('should update when token explore table network changed', () => {
    cy.visit('/tokens/ethereum')
    cy.getByTestId('tokens-network-filter-selected').click()
    cy.getByTestId('tokens-network-filter-option-optimism').click()
    cy.getByTestId('tokens-network-filter-selected').should('contain', 'Optimism')
    cy.reload()
    cy.getByTestId('tokens-network-filter-selected').should('contain', 'Optimism')
    cy.getByTestId('chain-selector-logo').invoke('attr', 'alt').should('eq', 'Ethereum')
  })
})
