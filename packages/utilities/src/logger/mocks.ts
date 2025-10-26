// mock this since it errors about multiple SDK instances in test mode
vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    // leave it empty as we should avoid it in test mode
    logger: {},
  },
}))
