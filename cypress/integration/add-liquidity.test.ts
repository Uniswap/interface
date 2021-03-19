describe('Add Liquidity', () => {
  describe('Mainnet/Ropsten', () => {
    let options: any

    beforeEach(() => {
      options = { networkName: 'ropsten' }
    })

    it('when pool is clicked should show connect fuse button', () => {
      cy.visit('/pool', options)
      cy.get('#fuse-connect-open').should('be.visible')
    })
  })

  describe('Fuse', () => {
    it('loads fuse token', () => {
      cy.visit('/add/FUSE')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'FUSE')
    })

    it('loads the two correct tokens', () => {
      cy.visit('/add/0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA-0xd8Bf72f3e163B9CF0C73dFdCC316417A5ac20670')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'DAI')
      cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'WETH')
    })

    it('does not crash if FUSE is duplicated', () => {
      cy.visit('/add/0x0BE9e53fd7EDaC9F859882AfdDa116645287C629-0x0BE9e53fd7EDaC9F859882AfdDa116645287C629')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'WFUSE')
      cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('not.contain.text', 'ETH')
    })

    it('token not in storage is loaded', () => {
      cy.visit('/add/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1-0xbf0718762B7951D56C52Cc7f75e4fa665a7FF0E5')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'VOLT')
      cy.get('#add-liquidity-input-tokenb .token-symbol-container').should('contain.text', 'DAIp')
    })

    it('single token can be selected', () => {
      cy.visit('/add/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'VOLT')
      cy.visit('/add/0xbf0718762B7951D56C52Cc7f75e4fa665a7FF0E5')
      cy.get('#add-liquidity-input-tokena .token-symbol-container').should('contain.text', 'DAIp')
    })

    it('redirects /add/token-token to add/token/token', () => {
      cy.visit('/add/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1-0xbf0718762B7951D56C52Cc7f75e4fa665a7FF0E5')
      cy.url().should(
        'contain',
        '/add/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1/0xbf0718762B7951D56C52Cc7f75e4fa665a7FF0E5'
      )
    })

    it('redirects /add/WETH-token to /add/WETH-address/token', () => {
      cy.visit('/add/0x0BE9e53fd7EDaC9F859882AfdDa116645287C629-0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1')
      cy.url().should(
        'contain',
        '/add/0x0BE9e53fd7EDaC9F859882AfdDa116645287C629/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1'
      )
    })

    it('redirects /add/token-WETH to /add/token/WETH-address', () => {
      cy.visit('/add/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1-0x0BE9e53fd7EDaC9F859882AfdDa116645287C629')
      cy.url().should(
        'contain',
        '/add/0xD93878D3b011a96C0fF97cee984cd5c76B36Afc1/0x0BE9e53fd7EDaC9F859882AfdDa116645287C629'
      )
    })
  })
})
