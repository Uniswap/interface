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
      const customListUrl =
        'https://raw.githubusercontent.com/fuseio/fuseswap-interface/master/src/constants/qa/beta-tokenlist.json'
      cy.get('#bridge-input-token .open-currency-select-button').click()
      cy.get('#currency-search-change-list-button').click()
      cy.get('#list-add-input').type(customListUrl)
      cy.get('#list-add-button').click({ force: true })
      cy.get('.sc-dxgOiQ').should('contain', 'FuseSwap Beta List')
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
      const customListUrl =
        'https://raw.githubusercontent.com/fuseio/fuseswap-interface/master/src/constants/qa/beta-tokenlist.json'
      cy.get('#swap-currency-output .open-currency-select-button').click()
      cy.get('#currency-search-change-list-button').click()
      cy.get('#list-add-input').type(customListUrl)
      cy.get('#list-add-button').click({ force: true })
      cy.get('.sc-dxgOiQ').should('contain', 'FuseSwap Beta List')
    })
  })
})
