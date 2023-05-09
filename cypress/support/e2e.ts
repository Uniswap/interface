// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@cypress/code-coverage/support'
import './commands'
import './setupTests'

// Disable logging for fetches, as they clutter the logs so as to make them unusable.
// See https://docs.cypress.io/api/commands/intercept#Disabling-logs-for-a-request.
const log = Cypress.log
Cypress.log = function (options, ...args) {
  if (options.displayName === 'script' || options.name === 'request') return
  return log(options, ...args)
} as typeof log

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from failing the test
  return false
})
