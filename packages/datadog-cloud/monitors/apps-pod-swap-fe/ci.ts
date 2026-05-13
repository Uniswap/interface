import { MonitorDefinition } from '../../types'
import { SWAP_FE_ADDITIONAL_SLACK_CHANNELS, TEAM, UNIVERSE_REPO_URL } from './constants'

/**
 * CI test failure monitors.
 *
 * Ported from UI-managed monitor:
 *   - 238400608 Apps-Swap: Web E2E Test Failure (ci-tests alert)
 */
export const swapFeCiMonitors: MonitorDefinition[] = [
  {
    id: 'swap_fe_web_e2e_test_failure',
    name: '[CI] Web E2E Test Failure',
    type: 'ci-tests alert',
    query:
      'ci-tests("test_level:test @git.branch:main @test.status:fail @test.type:web-e2e @team:apps-swap").rollup("count").last("4h") >= 1',
    alertBody:
      'Web e2e test(s) owned by the swap pod failed in CI on main. Investigate via the test links in the runbook.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 1 },
    logQuery: '@git.branch:main @team:apps-swap',
    runbookUrl: 'https://www.notion.so/uniswaplabs/Playwright-Tests-1a8c52b2548b807787cec1fffbfa42a1',
    readmeUrl: `${UNIVERSE_REPO_URL}/actions/workflows/web_e2e_tests_playwright.yml`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
    // Slack-only: CI test failures are informational, shouldn't page incident.io.
    enablePaging: false,
    includeIncidentWebhook: false,
  },
]
