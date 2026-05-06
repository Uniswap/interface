import { MonitorDefinition } from '../../types'
import { SWAP_POD_RUNBOOK, TEAM, UNIVERSE_REPO_URL } from './constants'

/**
 * Solana-specific swap quoting monitors.
 *
 * Ported from UI-managed monitor:
 *   - 249210551 [Web] High number of solana quoting errors (error-tracking alert)
 */
export const swapFeSolanaMonitors: MonitorDefinition[] = [
  {
    id: 'swap_fe_web_solana_quote_errors',
    name: '[Web] High number of solana quoting errors',
    type: 'error-tracking alert',
    query:
      'error-tracking("service:web-prod @context.tags.function:logSwapQuoteFailure @context.extra.amountSpecified.currency.chainId:501000101").source("all").impact().rollup("cardinality","@session.id").by("issue.id,env").last("4h") > 10',
    alertBody: 'High number of Solana quote processing failures on web.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 10 },
    logQuery:
      'service:web-prod @context.tags.function:logSwapQuoteFailure @context.extra.amountSpecified.currency.chainId:501000101',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
  },
]
