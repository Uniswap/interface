describe('Remove Liquidity', () => {
  it('redirects', () => {
    cy.visit('/remove/0xc778417E063141139Fce010982780140Aa0cD5Ab-0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85')
    cy.url().should(
      'contain',
      '/remove/0xc778417E063141139Fce010982780140Aa0cD5Ab/0xF9bA5210F91D0474bd1e1DcDAeC4C58E359AaD85'
    )
  })

  it('fuse remove', () => {
    cy.visit('/remove/FUSE/0xd8Bf72f3e163B9CF0C73dFdCC316417A5ac20670')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'FUSE')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'WETH')
  })

  it('fuse remove swap order', () => {
    cy.visit('/remove/0xd8Bf72f3e163B9CF0C73dFdCC316417A5ac20670/FUSE')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'FUSE')
  })

  it('loads the two correct tokens', () => {
    cy.visit('/remove/0xd8Bf72f3e163B9CF0C73dFdCC316417A5ac20670-0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'DAI')
  })

  it('does not crash if ETH is duplicated', () => {
    cy.visit('/remove/0x0BE9e53fd7EDaC9F859882AfdDa116645287C629-0x0BE9e53fd7EDaC9F859882AfdDa116645287C629')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'WFUSE')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'WFUSE')
  })

  it('token not in storage is loaded', () => {
    cy.visit('/remove/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1-0xbf0718762B7951D56C52Cc7f75e4fa665a7FF0E5')
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'VOLT')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'DAIp')
  })
})
