import * as pulumi from '@pulumi/pulumi'

const config = new pulumi.Config()

/**
 * Dashboard configuration loaded from Pulumi config / ESC
 *
 * Simplified compared to monitors - dashboards don't need:
 * - Team EP (escalation policy) - dashboards don't trigger incidents
 * - Slack channels - dashboards don't send notifications
 * - Incident webhooks - dashboards don't create incidents
 */
export interface DashboardSettings {
  environment: string
  tagFilter: string
  defaultTeam: string
}

// Build tagFilter: base filter from stack config, optionally ANDed with team-specific extra filter
const baseTagFilter = config.get('tagFilter') || '(unienv:prod OR env:prod)'
const tagFilterExtra = config.get('tagFilterExtra')
const tagFilter = tagFilterExtra ? `${baseTagFilter} AND ${tagFilterExtra}` : baseTagFilter

export const settings: DashboardSettings = {
  environment: config.get('environment') || 'prod',
  tagFilter,
  defaultTeam: config.get('defaultTeam') || 'dev-portal',
}
