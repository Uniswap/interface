import * as pulumi from '@pulumi/pulumi';
import {DashboardLink} from './types';

const config = new pulumi.Config();

/**
 * Team configuration from ESC
 * Each team has an escalation policy ID and slack channel
 */
export interface TeamConfig {
  ep: string;
  slack: string;
}

/**
 * Monitor configuration loaded from Pulumi config / ESC
 */
export interface MonitorSettings {
  environment: string;
  tagFilter: string;
  incidentWebhook: string;
  defaultTeam: string;
  teams: Record<string, TeamConfig>;
}

// Load team configurations from ESC
// Expected format in ESC: { "sre": { "ep": "01K4XB5BT0...", "slack": "@slack-sre-alerts" }, ... }
const teamsRaw = config.getObject<Record<string, TeamConfig>>('teams') || {};

// Build tagFilter: base filter from stack config, optionally ANDed with team-specific extra filter
const baseTagFilter = config.get('tagFilter') || '(unienv:prod OR env:prod)';
const tagFilterExtra = config.get('tagFilterExtra');
const tagFilter = tagFilterExtra
  ? `${baseTagFilter} AND ${tagFilterExtra}`
  : baseTagFilter;

export const settings: MonitorSettings & {
  disablePaging: boolean;
  disableSlack: boolean;
} = {
  environment: config.get('environment') || 'prod',
  tagFilter,
  incidentWebhook: config.get('incidentWebhook') || '@webhook-Incident-io',
  defaultTeam: config.get('defaultTeam') || 'dev-portal',
  teams: teamsRaw,
  // Set to true to disable all paging (EP tags + incident webhooks) for testing
  disablePaging: config.getBoolean('disablePaging') || false,
  // Set to true to disable all Slack notifications for testing
  disableSlack: config.getBoolean('disableSlack') || false,
};

/**
 * Get the team configuration, falling back to default team if not found.
 * Throws error if neither team nor default has configuration.
 */
export function getTeamConfig(team: string): TeamConfig {
  const teamConfig = settings.teams[team];
  if (teamConfig) {
    return teamConfig;
  }

  const defaultConfig = settings.teams[settings.defaultTeam];
  if (!defaultConfig) {
    throw new Error(
      `No configuration found for team '${team}' or default team '${settings.defaultTeam}'. ` +
        'Configure teams in Pulumi ESC (shared-infra/incident).'
    );
  }

  pulumi.log.warn(
    `No configuration found for team '${team}', using default team '${settings.defaultTeam}'`
  );
  return defaultConfig;
}

/**
 * Get the escalation policy tag for a team.
 * Falls back to default team if specified team not found.
 */
export function getEscalationPolicyTag(team: string): string {
  return getTeamConfig(team).ep;
}

/**
 * Get the slack channel for a team.
 * Falls back to default team if specified team not found.
 */
export function getSlackChannel(team: string): string {
  return getTeamConfig(team).slack;
}

/**
 * Build standard tags for a monitor
 */
export function buildTags(opts: {
  signalId: string;
  team: string;
  enablePaging?: boolean;
  additionalTags?: string[];
}): string[] {
  const tags = [
    `serverless_id:${opts.signalId}`,
    `env:${settings.environment}`,
    `unienv:${settings.environment}`,
    `team:${opts.team}`,
    'managed-by:pulumi',
  ];

  // Only include EP tag if paging is enabled (default: true) and not globally disabled
  if (opts.enablePaging !== false && !settings.disablePaging) {
    const ep = getEscalationPolicyTag(opts.team);
    tags.push(`ep:${ep}`);
  }

  if (opts.additionalTags) {
    tags.push(...opts.additionalTags);
  }

  return tags;
}

/**
 * Build standardized links section for alert body.
 *
 * Includes:
 * - Logs: Links to Datadog logs filtered by resource, time-bounded to alert window
 * - Runbook: Notion runbook for troubleshooting
 * - README: GitHub README for related documentation
 * - Dashboards: Relevant Datadog dashboards
 *
 * Uses Datadog template variables:
 * - {{last_triggered_at_epoch}} - when alert triggered (milliseconds)
 */
export function buildLinksSection(opts: {
  logQuery: string;
  runbookUrl: string;
  readmeUrl: string;
  dashboards: DashboardLink[];
}): string {
  // URL-encode the log query for use in URLs
  const encodedLogQuery = opts.logQuery
    .replace(/:/g, '%3A')
    .replace(/ /g, '%20');

  let links = `---

**Links:**

**Logs** (from alert start):
* [View Logs](/logs?query=${encodedLogQuery}&from_ts={{last_triggered_at_epoch}})

**Runbook:**
* [Troubleshooting Guide](${opts.runbookUrl})

**Codebase:**
* [README](${opts.readmeUrl})

**Dashboards:**`;

  for (const dashboard of opts.dashboards) {
    links += `\n* [${dashboard.name}](${dashboard.url})`;
  }

  return links;
}

/**
 * Build recovery links section with time-bounded log link.
 *
 * Uses Datadog template variables:
 * - {{last_triggered_at_epoch}} - when alert triggered
 * - {{last_resolved_at_epoch}} - when alert resolved
 */
export function buildRecoveryLinksSection(opts: {logQuery: string}): string {
  const encodedLogQuery = opts.logQuery
    .replace(/:/g, '%3A')
    .replace(/ /g, '%20');

  return `
**Logs** (alert window):
* [View Logs](/logs?query=${encodedLogQuery}&from_ts={{last_triggered_at_epoch}}&to_ts={{last_resolved_at_epoch}})`;
}

/**
 * Build alert message with incident.io webhook integration and standardized links
 */
export function buildMessage(opts: {
  alertBody: string;
  recoveryBody?: string;
  team: string;
  logQuery: string;
  runbookUrl: string;
  readmeUrl: string;
  dashboards: DashboardLink[];
  includeIncidentWebhook?: boolean;
}): string {
  // Disable webhook if globally disabled or explicitly set to false
  const includeWebhook =
    opts.includeIncidentWebhook !== false && !settings.disablePaging;
  const slackChannel = getSlackChannel(opts.team);

  // Build the links section
  const linksSection = buildLinksSection({
    logQuery: opts.logQuery,
    runbookUrl: opts.runbookUrl,
    readmeUrl: opts.readmeUrl,
    dashboards: opts.dashboards,
  });

  // Build recovery links
  const recoveryLinks = buildRecoveryLinksSection({logQuery: opts.logQuery});

  const tagContext = `aws_account: {{aws_account.name}}, service: {{service.name}}
uniapp: {{uniapp.name}}, unistk: {{unistk.name}}, unienv: {{unienv.name}}, unigrp: {{unigrp.name}}, uniprj: {{uniprj.name}}, unisha: {{unisha.name}}, uniown: {{uniown.name}}

`;

  let message = `{{#is_alert}}\n${tagContext}${opts.alertBody}\n\n${linksSection}`;

  if (includeWebhook) {
    message += `\n\n${settings.incidentWebhook}`;
  }

  message += '\n{{/is_alert}}\n\n';

  // Warning block with same tag context
  message += `{{#is_warning}}\n${tagContext}${opts.alertBody}\n\n${linksSection}\n{{/is_warning}}\n\n`;

  if (includeWebhook) {
    message += `{{#is_alert_recovery}} ${settings.incidentWebhook} {{/is_alert_recovery}}\n\n`;
  }

  // Only include Slack channel if not globally disabled
  if (!settings.disableSlack) {
    message += `${slackChannel}\n`;
  }

  if (opts.recoveryBody) {
    message += `\n{{#is_recovery}}\n${tagContext}${opts.recoveryBody}\n${recoveryLinks}\n{{/is_recovery}}`;
  }

  return message;
}
