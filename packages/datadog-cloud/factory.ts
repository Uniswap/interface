import * as datadog from '@pulumi/datadog';
import {MonitorDefinition, defaultMonitorOptions} from './types';
import {buildTags, buildMessage, settings} from './config';

/**
 * Create a Datadog monitor from a MonitorDefinition
 */
export function createMonitor(def: MonitorDefinition): datadog.Monitor {
  const resourceName = `${def.team}-${settings.environment}-${def.id}`;

  // Format team name for display: sre -> SRE, dev-portal -> Dev-portal
  const teamDisplay =
    def.team.toUpperCase() === def.team
      ? def.team
      : def.team.charAt(0).toUpperCase() + def.team.slice(1);

  // Auto-prepend [TEAM] to monitor name if not already present
  const monitorName = def.name.startsWith('[')
    ? def.name
    : `[${teamDisplay}] ${def.name}`;

  const tags = buildTags({
    signalId: def.id,
    team: def.team,
    enablePaging: def.enablePaging,
    additionalTags: def.additionalTags,
  });

  const message = buildMessage({
    alertBody: def.alertBody,
    recoveryBody: def.recoveryBody,
    team: def.team,
    logQuery: def.logQuery,
    runbookUrl: def.runbookUrl,
    readmeUrl: def.readmeUrl,
    dashboards: def.dashboards,
    includeIncidentWebhook: def.includeIncidentWebhook,
  });

  return new datadog.Monitor(resourceName, {
    ...defaultMonitorOptions,
    name: monitorName,
    type: def.type,
    query: def.query,
    message: message,
    tags: tags,
    priority: def.priority.toString(),
    monitorThresholds: def.thresholds
      ? {
          critical: def.thresholds.critical?.toString(),
          warning: def.thresholds.warning?.toString(),
          criticalRecovery: def.thresholds.criticalRecovery?.toString(),
          warningRecovery: def.thresholds.warningRecovery?.toString(),
        }
      : undefined,
    monitorThresholdWindows: def.thresholdWindows,
    noDataTimeframe: def.noDataTimeframe,
    notifyNoData: def.notifyNoData,
    renotifyInterval: def.renotifyInterval,
    newGroupDelay: def.newGroupDelay,
    evaluationDelay: def.evaluationDelay,
    onMissingData: def.onMissingData,
  });
}

/**
 * Create multiple monitors from an array of definitions
 */
export function createMonitors(
  defs: MonitorDefinition[]
): Record<string, datadog.Monitor> {
  const monitors: Record<string, datadog.Monitor> = {};

  for (const def of defs) {
    monitors[def.id] = createMonitor(def);
  }

  return monitors;
}
