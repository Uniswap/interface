export const OKTA_ISSUER = 'https://login.uniswap.org'

// Identifier for the Config CLI Okta App Integration. Not a secret.
export const OKTA_CLIENT_ID = '0oa130nd2z3SI4USX698'

export const OKTA_SCOPES = 'openid profile email groups offline_access'

export const OKTA_DEVICE_AUTH_URL = `${OKTA_ISSUER}/oauth2/v1/device/authorize`
export const OKTA_TOKEN_URL = `${OKTA_ISSUER}/oauth2/v1/token`
export const OKTA_REVOKE_URL = `${OKTA_ISSUER}/oauth2/v1/revoke`

// TODO: switch each app's destination to its real env file (e.g. apps/web/.env.local,
// apps/mobile/.env.defaults.local) once the Config Service migration is complete.
// Using .env.new during the migration keeps the old values intact for fallback.
export const ENV_FILENAME = '.env.new'
