import { getTestSelector } from '../utils'

const PUDGY_COLLECTION_ADDRESS = '0xbd3531da5cf5857e7cfaa92426877b022e612cf8'

describe('Testing nfts', () => {
  it('should load nft leaderboard', () => {
    cy.visit('/')
    cy.get(getTestSelector('nft-nav')).first().click()
    cy.get(getTestSelector('nft-nav')).first().should('exist')
    cy.get(getTestSelector('nft-nav')).first().click()
    cy.get(getTestSelector('nft-trending-collection')).its('length').should('be.gte', 25)
  })

  it('should load pudgy penguin collection page', () => {
    cy.visit(`/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.get(getTestSelector('nft-collection-asset')).should('exist')
    cy.get(getTestSelector('nft-collection-filter-buy-now')).should('not.exist')
    cy.get(getTestSelector('nft-filter')).first().click()
    cy.get(getTestSelector('nft-collection-filter-buy-now')).should('exist')
  })

  it('should be able to navigate to activity', () => {
    cy.visit(`/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.get(getTestSelector('nft-activity')).first().click()
    cy.get(getTestSelector('nft-activity-row')).should('exist')
  })

  it('should go to the details page', () => {
    cy.visit(`/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.get(getTestSelector('nft-filter')).first().click()
    cy.get(getTestSelector('nft-collection-filter-buy-now')).click()
    cy.get(getTestSelector('nft-collection-asset')).first().click()
    cy.get(getTestSelector('nft-details-traits')).should('exist')
    cy.get(getTestSelector('nft-details-activity')).should('exist')
    cy.get(getTestSelector('nft-details-description')).should('exist')
    cy.get(getTestSelector('nft-details-asset-details')).should('exist')
  })

  it('should toggle buy now on details page', () => {
    cy.visit(`/nfts/collection/${PUDGY_COLLECTION_ADDRESS}`)
    cy.get(getTestSelector('nft-filter')).first().click()
    cy.get(getTestSelector('nft-collection-filter-buy-now')).click()
    cy.get(getTestSelector('nft-collection-asset')).first().click()
    cy.get(getTestSelector('nft-details-description-text')).should('exist')
    cy.get(getTestSelector('nft-details-description')).click()
    cy.get(getTestSelector('nft-details-description-text')).should('not.exist')
    cy.get(getTestSelector('nft-details-toggle-bag')).eq(1).click()
    cy.get(getTestSelector('nft-bag')).should('exist')
  })

  it('should navigate to and from the owned nfts page', () => {
    cy.visit('/')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('NFTs').click()
    cy.get(getTestSelector('mini-portfolio-nft')).first().click()
    cy.get(getTestSelector('mini-portfolio-navbar')).should('not.be.visible')
  })
})
