export const OKTA_ISSUER = 'https://login.uniswap.org'

// Identifier for the Config CLI Okta App Integration. Not a secret.
export const OKTA_CLIENT_ID = '0oa130nd2z3SI4USX698'

export const OKTA_SCOPES = 'openid profile email groups offline_access'

export const OKTA_DEVICE_AUTH_URL = `${OKTA_ISSUER}/oauth2/v1/device/authorize`
export const OKTA_TOKEN_URL = `${OKTA_ISSUER}/oauth2/v1/token`
export const OKTA_REVOKE_URL = `${OKTA_ISSUER}/oauth2/v1/revoke`

// Filename that `config:pull` writes per app (apps/<app>/.env), consumed by the build tooling.
export const ENV_FILENAME = '.env'

// Checked-in per-app dev defaults (apps/<app>/.env.dev), kept in sync by `sync-dev`.
export const DEV_ENV_FILENAME = '.env.dev'
