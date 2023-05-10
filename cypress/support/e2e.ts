// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@cypress/code-coverage/support'
import './commands'
import './setupTests'

// Squelch logs from fetches, as they clutter the logs so much as to make them unusable.
// See https://docs.cypress.io/api/commands/intercept#Disabling-logs-for-a-request.
// TODO(https://github.com/cypress-io/cypress/issues/26069): Squelch only wildcard logs once Cypress allows it.
const log = Cypress.log
Cypress.log = function (options, ...args) {
  if (options.displayName === 'script' || options.name === 'request') return
  return log(options, ...args)
} as typeof log

Cypress.on('uncaught:exception', () => {
  // returning false here prevents Cypress from failing the test
  return false
})
