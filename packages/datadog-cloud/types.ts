import * as datadog from '@pulumi/datadog';

/**
 * Dashboard link configuration
 */
export interface DashboardLink {
  /** Display name for the dashboard */
  name: string;
  /** Datadog dashboard URL path (e.g., /dashboard/abc-123) */
  url: string;
}

/**
 * Monitor definition input - simplified interface for defining monitors
 */
export interface MonitorDefinition {
  /** Unique identifier for the monitor (used in resource name and tags) */
  id: string;

  /** Display name - can include template variables like {{service.name}} */
  name: string;

  /** Monitor type */
  type:
    | 'query alert'
    | 'event-v2 alert'
    | 'composite'
    | 'log alert'
    | 'metric alert'
    | 'ci-pipelines alert';

  /** Datadog query */
  query: string;

  /** Alert message body (will be wrapped with standardized links section) */
  alertBody: string;

  /** Recovery message body (optional) */
  recoveryBody?: string;

  /** Team that owns this monitor - used to lookup EP from ESC */
  team: string;

  /** Monitor priority (1-5, where 1 is highest) */
  priority: 1 | 2 | 3 | 4 | 5;

  /**
   * Log query filter for the affected resource.
   * Used to generate log links in alert body.
   * Examples:
   *   - "service:{{service.name}}"
   *   - "host:{{host.name}}"
   */
  logQuery: string;

  /**
   * Notion runbook URL for this monitor/service.
   * Should contain troubleshooting steps and escalation procedures.
   */
  runbookUrl: string;

  /**
   * GitHub README URL for the service codebase.
   * Links to the service's documentation in the repository.
   */
  readmeUrl: string;

  /**
   * Relevant Datadog dashboards for investigating this alert.
   */
  dashboards: DashboardLink[];

  /** Threshold configuration */
  thresholds?: {
    critical?: number;
    warning?: number;
    criticalRecovery?: number;
    warningRecovery?: number;
  };

  /** Threshold windows for anomaly monitors */
  thresholdWindows?: {
    triggerWindow?: string;
    recoveryWindow?: string;
  };

  /** Minutes before notifying on missing data (0 = disabled) */
  noDataTimeframe?: number;

  /** Notify when data stops reporting */
  notifyNoData?: boolean;

  /** Minutes between re-notifications (0 = disabled) */
  renotifyInterval?: number;

  /** Seconds to wait before evaluating new groups */
  newGroupDelay?: number;

  /** Seconds to delay metric evaluation */
  evaluationDelay?: number;

  /** Additional tags beyond the standard ones */
  additionalTags?: string[];

  /** Include incident.io webhook (default: true) */
  includeIncidentWebhook?: boolean;

  /** Enable paging via escalation policy tag (default: true) */
  enablePaging?: boolean;

  /** Only deploy this monitor on prod stacks (for environment-agnostic queries that would duplicate) */
  prodOnly?: boolean;

  /** On missing data behavior */
  onMissingData?:
    | 'default'
    | 'show_no_data'
    | 'resolve'
    | 'show_and_notify_no_data';
}

/**
 * Standard monitor options
 */
export const defaultMonitorOptions: Partial<datadog.MonitorArgs> = {
  notifyAudit: false,
  includeTags: false,
  onMissingData: 'default',
};
