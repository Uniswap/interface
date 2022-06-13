// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import './ethereum'

beforeEach(() => {
  cy.intercept(/infura.io/, (res) => {
    res.headers['origin'] = 'http://localhost:3000'
    res.continue()
  })
})
