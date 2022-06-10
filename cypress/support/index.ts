// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import './ethereum'

// Unregister the ServiceWorker between test suites.
// Cypress wraps the document to allow for cross-domain inspection, which the ServiceWorker breaks.
beforeEach(async () => {
  const registration = await window.navigator.serviceWorker.getRegistration()
  registration?.unregister()
})
