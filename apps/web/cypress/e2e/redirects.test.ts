
describe('Redirect', () => {
  it('should redirect to /vote/create-proposal when visiting /create-proposal', () => {
    cy.visit('/create-proposal')
    cy.url().should('match', /\/vote.uniswapfoundation.org/)
  })
  it('should redirect to /not-found when visiting nonexist url', () => {
    cy.visit('/none-exist-url')
    cy.url().should('match', /\/not-found/)
  })
})

describe('RedirectExplore', () => {
  it('should redirect from /tokens/ to /explore', () => {
    cy.visit('/tokens')
    cy.url().should('match', /\/explore/)

    cy.visit('/tokens/ethereum')
    cy.url().should('match', /\/explore\/tokens\/ethereum/)

    cy.visit('/tokens/optimism/NATIVE')
    cy.url().should('match', /\/explore\/tokens\/optimism\/NATIVE/)
  })
})

describe('Legacy Pool Redirects', () => {
  it('should redirect /pool to /positions', () => {
    cy.visit('/pool')
    cy.url().should('match', /\/positions/)
  })

  it('should redirect /pool/:tokenId with chain param to /positions/v3/:chainName/:tokenId', () => {
    cy.visit('/pool/123?chain=mainnet')
    cy.url().should('match', /\/positions\/v3\/ethereum\/123/)
  })

  it('should redirect add v2 liquidity to positions create page', () => {
    cy.visit('/add/v2/0x318400242bFdE3B20F49237a9490b8eBB6bdB761/ETH')
    cy.url().should('match', /\/positions\/create\/v2\?currencyA=0x318400242bFdE3B20F49237a9490b8eBB6bdB761&currencyB=ETH/)
  })


  it('should redirect add v3 liquidity to positions create page', () => {
    cy.visit('/add/0x318400242bFdE3B20F49237a9490b8eBB6bdB761/ETH')
    cy.url().should('match', /\/positions\/create\/v3\?currencyA=0x318400242bFdE3B20F49237a9490b8eBB6bdB761&currencyB=ETH/)
  })


  it('should redirect remove v2 liquidity to positions page', () => {
    cy.visit('/remove/v2/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
    cy.url().should('match', /\/positions\/v2\/ethereum\/0xBb2b8038a1640196FbE3e38816F3e67Cba72D940/)
  })

  it('should redirect remove v3 liquidity to positions page', () => {
    cy.visit('/remove/825708')
    cy.url().should('match', /\/positions\/v3\/ethereum\/825708/)
  })
  
})
