# Sentry Integration

Sentry is used for error reporting and performance monitoring. It's especially helpful to alert on newly introduced crashing bugs and bad third-party integrations.

Sentry integration is configured in [./index.ts](./index.ts) through its SDK.

## Sentry performance monitoring

Sentry performance traces are viewable in the [performance dashboard](https://sentry.io/performance/).
Most of the performance monitoring integration is done [./trace.ts](./trace.ts) and [./request.ts](./request.ts).

## Sentry error reporting

Sentry errors are viewable in the [issues dashboard](https://sentry.io/issues/).
Most of the error reporting integration is done in the `beforeSend` function defined in ./errors.ts.

Sentry is configured to alert in <https://sentry.io/alerts/rules/interface>.
Sentry alerting will page the web oncall.

For generic errors, Sentry is configured to alert when:

- Rolling 1-hour crash free session rate falls below a threshold
- Over 50 users have the same error in an hour

## Development

### Developing new Sentry filters

`beforeSend` is used to filter or to modify Sentry events.

Filtering Sentry events is done through `shouldRejectError`, and can be unit-tested without integration.

Modifying Sentry events is done on a per-event basis, and should be manually tested with Sentry to ensure the modified event shows up as expected (event name, fingerprint, etc.).

### Manually testing Sentry events (errors and tracing) from localhost

- Configure your `.env` to enable localhost Sentry reporting:
  - Set `REACT_APP_SENTRY_DSN` using the ["localhost (for testing only)"](https://sentry.io/settings/projects/interface/keys/).
  - Set `REACT_APP_SENTRY_ENABLED=true`.
  - If you're testing tracing, set `REACT_APP_SENTRY_TRACES_SAMPLE_RATE=1`.
- Enable the ["localhost (for testing only)"](https://sentry.io/settings/projects/interface/keys/).
- Turn off the [inbound filter](https://sentry.io/settings/projects/interface/filters/data-filters/) for localhost events.

*Make sure to turn the inbound filter back on and to disable the "localhost" key when you are done.*

To test an unhandled error or rejection, you just need to create one in the console:

```js
Promise.reject('this is an unhandled rejection')
// or
throw new Error('this is an unhandled error')
```

You should then be able to see it in the ["development" issues dashboard](https://sentry.io/issues/?environment=development).
