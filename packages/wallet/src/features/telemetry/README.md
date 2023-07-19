# Telemetry

## Summary

We use Amplitude as our logging library and it's implemented using the Trace component. We also have the ability to log single events where Trace is not possible to use.

A key component for analytics are the user properties, these need to be set at app start and updated every time they change during a an app session. These properties will be tied to all events logged in the app without having to manually do so. The component `<TraceUserProperties/>` keeps track of these custom properties and updates them as they change.

All screens that are part of the navigation stack will automatically log impressions as a `<Trace>` element has already been setup for every [onStateChange](https://github.com/Uniswap/mobile/blob/3903efcf27f0bcb08d9e1b15e3b39a71d7d56c17/src/app/navigation/NavigationContainer.tsx#L52).

Components that need special Trace events for impressions are Modals, Banners and all sections of the app that are not part of the higher level screens, e.g. NFT Tab, Tokens Tab, etc.

## Usage

For more information, check out the documentation for the [Trace](../../components/telemetry/README.md) component

## Logging beyond the Trace component

The function `sendAnalyticsEvent(eventName, eventProperties)` is available to directly log an event for cases that are not covered by the Trace component such as:

1. When logging from effects or callbacks that are not triggered by an impression or click
2. When logging from components that handle their own navigation (e.g. TabView)
3. Outside of a React's render context

### Including TraceContext

In cases where you're in a React's render context, we still want to send the parent TraceContext with these events. The hook `useTrace()` returns any properties from a parent TraceContext in case they exist:

```typescript
const parentTrace = useTrace()

const onSomeAction = (index: number) => {
  sendAnalyticsEvent(EventName.MyEventName, {
    ... needed properties ...
    ...parentTrace,
  })
}
```

## Future Work

Currently this project is not yet using the [analytics](https://github.com/Uniswap/analytics) package or fully using [analytics-events](https://github.com/Uniswap/analytics-events). The following work should be done in the future to complete standardizing of events and logging across products:

1. Move all event taxonomy related definitions to [analytics-events](https://github.com/Uniswap/analytics-events) and import from the package.
2. Add React Native and other needed support to [analytics](https://github.com/Uniswap/analytics) package to support the needs of the mobile repo, migrating reusable utilities where possible.
3. Integrate [analytics](https://github.com/Uniswap/analytics) into the mobile repo.
