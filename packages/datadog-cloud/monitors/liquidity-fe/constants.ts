export const TEAM = 'liquidity'

export const LIQUIDITY_FE_RUNBOOK =
  'https://www.notion.so/uniswaplabs/Liquidity-Providing-API-Runbook-18bc52b2548b80569032cf75ef79cb71'

export const UNIVERSE_REPO_URL = 'https://github.com/Uniswap/universe'

export const LIQUIDITY_FE_ADDITIONAL_SLACK_CHANNELS = ['@slack-apps-alerts-lp']

/**
 * RUM query filter matching all liquidity-related view paths.
 * Covers: /positions, /pool, /pools, /add, /remove (and all sub-paths).
 */
export const LIQUIDITY_VIEW_FILTER = '@view.url_path:(/position* OR /pool* OR /add* OR /remove*)'
