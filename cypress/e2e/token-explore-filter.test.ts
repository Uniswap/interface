describe.skip('Token explore filter', () => {
  before(() => {
    cy.visit('/')
  })

  it('should filter correctly by uni search term', () => {
    cy.visit('/tokens')
    cy.get('[data-cy="token-name"]').then(($els) => {
      const tokenNames = Array.from($els, (el) => el.innerText)
      const filteredByUni = tokenNames.filter((tokenName) => tokenName.toLowerCase().includes('uni'))
      cy.wrap(filteredByUni).as('filteredByUni')
    })

    cy.get('[data-cy="explore-tokens-search-input"]')
      .clear()
      .type('uni')
      .type('{enter}')
      .then(() => {
        cy.get('[data-cy="token-name"]').its('length').should('be.lt', 100)
        cy.get('@filteredByUni').then((filteredByUni) => {
          cy.get('[data-cy="token-name"]').then(($els) => {
            const tokenNames = Array.from($els, (el) => el.innerText)
            expect(tokenNames.length).to.equal(filteredByUni.length)
            tokenNames.forEach((tokenName) => {
              expect(filteredByUni).to.include(tokenName)
            })
          })
        })
      })
  })

  it('should filter correctly by dao search term', () => {
    cy.visit('/tokens')
    cy.get('[data-cy="token-name"]').then(($els) => {
      const tokenNames = Array.from($els, (el) => el.innerText)
      const filteredByDao = tokenNames.filter((tokenName) => tokenName.toLowerCase().includes('dao'))
      cy.wrap(filteredByDao).as('filteredByDao')
    })

    cy.get('[data-cy="explore-tokens-search-input"]')
      .clear()
      .type('dao')
      .type('{enter}')
      .then(() => {
        cy.get('[data-cy="token-name"]').its('length').should('be.lt', 100)
        cy.get('@filteredByDao').then((filteredByDao) => {
          cy.get('[data-cy="token-name"]').then(($els) => {
            const tokenNames = Array.from($els, (el) => el.innerText)
            expect(tokenNames.length).to.equal(filteredByDao.length)
            tokenNames.forEach((tokenName) => {
              expect(filteredByDao).to.include(tokenName)
            })
          })
        })
      })
  })

  it('should filter correctly by ax search term', () => {
    cy.visit('/tokens')
    cy.get('[data-cy="token-name"]').then(($els) => {
      const tokenNames = Array.from($els, (el) => el.innerText)
      const filteredByAx = tokenNames.filter((tokenName) => tokenName.toLowerCase().includes('ax'))
      cy.wrap(filteredByAx).as('filteredByAx')
    })

    cy.get('[data-cy="explore-tokens-search-input"]')
      .clear()
      .type('ax')
      .type('{enter}')
      .then(() => {
        cy.get('[data-cy="token-name"]').its('length').should('be.lt', 100)
        cy.get('@filteredByAx').then((filteredByAx) => {
          cy.get('[data-cy="token-name"]').then(($els) => {
            const tokenNames = Array.from($els, (el) => el.innerText)
            expect(tokenNames.length).to.equal(filteredByAx.length)
            tokenNames.forEach((tokenName) => {
              expect(filteredByAx).to.include(tokenName)
            })
          })
        })
      })
  })
})
