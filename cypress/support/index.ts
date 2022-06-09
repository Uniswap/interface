// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.ts using ES2015 syntax:
import './ethereum'

// Unregister the ServiceWorker between test suites.
// Doing this globally ensures that tests always run on the latest version of the site.
beforeEach(async () => {
  await window.navigator.serviceWorker.getRegistration().then((sw) => sw?.unregister())
})
