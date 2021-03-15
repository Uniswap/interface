describe('Lists', () => {
  describe('Bridge', () => {
    beforeEach(() => {
      cy.visit('/bridge')
    })

    it('fuse token list is default list', () => {
      cy.get('#bridge-input-token .open-currency-select-button').click()
      cy.get('#currency-search-selected-list-name').should('contain', 'FuseSwap Test List')
    })

    it('change list', () => {
      const customListUrl = 'https://www.coingecko.com/tokens_list/uniswap/defi_100/v_0_0_0.json'
      cy.get('#bridge-input-token .open-currency-select-button').click()
      cy.get('#currency-search-change-list-button').click()
      cy.get('#list-add-input').type(customListUrl)
      cy.get('#list-add-button').click({ force: true })
      cy.get('.sc-dxgOiQ').should('contain', 'CoinGecko DeFi 100')
    })
  })

  describe('Swap', () => {
    beforeEach(() => {
      cy.visit('/swap')
    })

    it('fuse token list is default list', () => {
      cy.get('#swap-currency-output .open-currency-select-button').click()
      cy.get('#currency-search-selected-list-name').should('contain', 'FuseSwap Token List')
    })

    it('change list', () => {
      const customListUrl = 'https://www.coingecko.com/tokens_list/uniswap/defi_100/v_0_0_0.json'
      cy.get('#swap-currency-output .open-currency-select-button').click()
      cy.get('#currency-search-change-list-button').click()
      cy.get('#list-add-input').type(customListUrl)
      cy.get('#list-add-button').click()
      cy.get('.sc-dxgOiQ').should('contain', 'CoinGecko DeFi 100')
    })
  })
})
