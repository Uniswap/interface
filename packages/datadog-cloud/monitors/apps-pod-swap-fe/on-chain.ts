import { MonitorDefinition } from '../../types'
import { SWAP_FE_ADDITIONAL_SLACK_CHANNELS, SWAP_POD_RUNBOOK, TEAM, UNIVERSE_REPO_URL } from './constants'

/**
 * Monitors for on-chain transaction failures.
 *
 * Ported from UI-managed monitor:
 *   - 238156857 [Mobile/Ext] Elevated On Chain failures (query alert)
 */
export const swapFeOnChainMonitors: MonitorDefinition[] = [
  {
    id: 'swap_fe_mobile_ext_onchain_failures',
    name: '[Mobile/Ext] Elevated On Chain failures',
    type: 'query alert',
    query: 'sum(last_2h):sum:wallet.onchainfailures{*} by {args.chainlabel}.as_count() > 200',
    alertBody:
      'Elevated on-chain failure rate. TX was successfully submitted from the app but failed on-chain when polling for status.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 200 },
    logQuery: 'service:(wallet OR mobile OR extension)',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/packages/wallet`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
  },
]
