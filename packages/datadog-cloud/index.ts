import * as pulumi from '@pulumi/pulumi';
import {createMonitors} from './factory';
import {
  devPortalLatencyMonitors,
  devPortalErrorMonitors,
  devPortalAvailabilityMonitors,
  devPortalAuthMonitors,
  devPortalGatewayMonitors,
  devPortalLogMonitors,
} from './monitors';
import {settings} from './config';
import {MonitorDefinition} from './types';

// Log configuration
pulumi.log.info(`Environment: ${settings.environment}`);
pulumi.log.info(`Team: ${settings.defaultTeam}`);
pulumi.log.info(`Tag Filter: ${settings.tagFilter}`);

const isProd = settings.environment === 'prod';

// Create monitors based on the team specified in config
// Each stack should only create monitors for its team
const team = settings.defaultTeam;

// Team monitor definitions
const teamMonitors: Record<
  string,
  {monitors: MonitorDefinition[]; category: string}[]
> = {
  'dev-portal': [
    {monitors: devPortalLatencyMonitors, category: 'latency'},
    {monitors: devPortalErrorMonitors, category: 'errors'},
    {monitors: devPortalAvailabilityMonitors, category: 'availability'},
    {monitors: devPortalAuthMonitors, category: 'auth'},
    {monitors: devPortalGatewayMonitors, category: 'gateway'},
    {monitors: devPortalLogMonitors, category: 'logs'},
  ],
};

// Get monitors for current team
const currentTeamMonitors = teamMonitors[team];
if (!currentTeamMonitors) {
  throw new Error(
    `Unknown team: ${team}. Valid teams: ${Object.keys(teamMonitors).join(', ')}`
  );
}

// Create monitors for current team
const createdMonitors: Record<
  string,
  Record<string, pulumi.Output<string>>
> = {};
let totalCount = 0;

for (const {monitors, category} of currentTeamMonitors) {
  // Filter out prodOnly monitors on non-prod stacks
  const filtered = isProd ? monitors : monitors.filter(m => !m.prodOnly);
  const created = createMonitors(filtered);
  createdMonitors[category] = Object.fromEntries(
    Object.entries(created).map(([k, v]) => [k, v.id])
  );
  totalCount += Object.keys(created).length;
}

// Export monitor IDs grouped by category
export const monitorIds = createdMonitors;

// Export summary
export const summary = {
  team,
  environment: settings.environment,
  totalMonitors: totalCount,
  byCategory: Object.fromEntries(
    Object.entries(createdMonitors).map(([cat, monitors]) => [
      cat,
      Object.keys(monitors).length,
    ])
  ),
};
