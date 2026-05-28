/**
 * Identifies which app a config belongs to.
 *
 * Set via process.env.APP_ID (injected by each app's bundler) and consumed via
 * BaseConfigValues.appId. Required field on BaseConfigSchema — every app
 * calling parseConfig must resolve to a valid AppId.
 */
export enum AppId {
  Cli = 'cli',
  DevPortal = 'dev-portal',
  Extension = 'extension',
  MissionControl = 'mission-control',
  Mobile = 'mobile',
  Web = 'web',
}
