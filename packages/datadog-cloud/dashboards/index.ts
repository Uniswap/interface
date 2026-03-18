import * as pulumi from '@pulumi/pulumi';
import {createDashboards} from './dashboard-factory';
import {devPortalDashboards} from './definitions';
import {settings} from './config';
import {DashboardDefinition} from './dashboard-types';

// Log configuration
pulumi.log.info(`Environment: ${settings.environment}`);
pulumi.log.info(`Team: ${settings.defaultTeam}`);
pulumi.log.info(`Tag Filter: ${settings.tagFilter}`);

// Team dashboard definitions
const teamDashboards: Record<string, DashboardDefinition[]> = {
  'dev-portal': devPortalDashboards,
};

// Get dashboards for current team
const team = settings.defaultTeam;
const currentTeamDashboards = teamDashboards[team] || [];

if (currentTeamDashboards.length === 0) {
  pulumi.log.warn(`No dashboards defined for team: ${team}`);
}

// Create dashboards
const createdDashboards = createDashboards(currentTeamDashboards);
const dashboardIdMap: Record<string, pulumi.Output<string>> =
  Object.fromEntries(
    Object.entries(createdDashboards).map(([k, v]) => [k, v.id])
  );

// Exports
export const dashboardIds = dashboardIdMap;

export const summary = {
  team,
  environment: settings.environment,
  totalDashboards: Object.keys(dashboardIdMap).length,
  dashboards: Object.keys(dashboardIdMap),
};
