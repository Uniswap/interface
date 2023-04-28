const PUDGY_COLLECTION_ADDRESS = '0xbd3531da5cf5857e7cfaa92426877b022e612cf8'
const BONSAI_COLLECTION_ADDRESS = '0xec9c519d49856fd2f8133a0741b4dbe002ce211b'

describe('Testing nfts', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load nft leaderboard', () => {
    cy.getByTestId('nft-nav').first().click()
    cy.getByTestId('nft-nav').first().should('exist')
    cy.getByTestId('nft-nav').first().click()
    cy.getByTestId('nft-trending-collection').its('length').should('be.gte', 25)
  })

  it('should load pudgy penguin collection page', () => {
    cy.visit(`/#/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.getByTestId('nft-collection-asset').should('exist')
    cy.getByTestId('nft-collection-filter-buy-now').should('not.exist')
    cy.getByTestId('nft-filter').first().click()
    cy.getByTestId('nft-collection-filter-buy-now').should('exist')
  })

  it('should be able to navigate to activity', () => {
    cy.visit(`/#/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.getByTestId('nft-activity').first().click()
    cy.getByTestId('nft-activity-row').should('exist')
  })

  it('should go to the details page', () => {
    cy.visit(`/#/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.getByTestId('nft-filter').first().click()
    cy.getByTestId('nft-collection-filter-buy-now').click()
    cy.getByTestId('nft-collection-asset').first().click()
    cy.getByTestId('nft-details-traits').should('exist')
    cy.getByTestId('nft-details-activity').should('exist')
    cy.getByTestId('nft-details-description').should('exist')
    cy.getByTestId('nft-details-asset-details').should('exist')
  })

  it('should toggle buy now on details page', () => {
    cy.visit(`#/nfts/asset/${BONSAI_COLLECTION_ADDRESS}/7580`)
    cy.getByTestId('nft-details-description-text').should('exist')
    cy.getByTestId('nft-details-description').click()
    cy.getByTestId('nft-details-description-text').should('not.exist')
    cy.getByTestId('nft-details-toggle-bag').eq(1).click()
    cy.getByTestId('nft-bag').should('exist')
  })

  it('should navigate to the owned nfts page', () => {
    cy.getByTestId('web3-status-connected').click()
    cy.getByTestId('nft-view-self-nfts').click()
  })

  it('should close the sidebar when navigating to NFT details', () => {
    cy.getByTestId('web3-status-connected').click()
    cy.getByTestId('mini-portfolio-nav-nfts').click()
    cy.getByTestId('mini-portfolio-nft').first().click()
    cy.contains('Buy crypto').should('not.be.visible')
  })
})
