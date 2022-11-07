# Telemetry

We use Amplitude as our logging library and it's implemented using the Trace and TraceEvent pattern. We also have the ability to log single events where Trace/TraceEvent is not possible to use.

A key component for analytics are the user properties, these need to be set at app start and updated everytime they change during a an app session. These properties will be tied to all events logged in the app without having to manually do so. The component `<TraceUserProperties/>` keeps track of these custom properties and updates them as they change.

All screens that are part of the navigation stack will automatically log impressions as a `<Trace>` element has already been setup for every [onStateChange](https://github.com/Uniswap/mobile/blob/3903efcf27f0bcb08d9e1b15e3b39a71d7d56c17/src/app/navigation/NavigationContainer.tsx#L52).

Components that need special Trace events for impressions are Modals, Banners and all sections of the app that are not part of the higher level screens, e.g. NFT Tab, Tokens Tab, etc.

## Usage

### Trace

Component that sets context metadata (Screen, Section, Modal) for child Trace and TraceEvent components to consume. Optionally can also log an “impression” event in Amplitude (eg: when a screen is viewed or when a modal is opened)

```javascript
<Trace screen={Screens.Home} logImpression properties={{prop: value}}>
  {children}
</Trace>
```

`properties`: Extra properties to send with an impression event. e.g. Token Details Screen:

`<Trace screen={Screens.TokenDetails} properties={{tokenAddress: address, tokenName: name}}>`

### TraceEvent

Component that bundles context metadata from parent “Trace” components with the current component’s context. Triggers Amplitude event logging upon calling certain event handlers passed on to TraceEvent component as props.

```javascript
<TraceEvent
  events={[Event.OnPress]}
  name={EventName.TOKEN_SELECTED}
  properties={{token_symbol: item.currency.symbol, chain_id: address.currency.chainId}}
>
  <TokenBalanceItem
    portfolioBalance={item}
    onPressToken={onPressToken}
    onPressTokenIn={onPressTokenIn}
  />
</ TraceEvent>
```

### Logging when Trace/TraceEvent are not appropriate

The function `sendAnalyticsEvent(eventName, eventProperties)` can be called in cases where we cannot use the components discussed above.

Some examples of where this may be useful are:

1. When logging from `useEffect` on desired results/effects
2. When logging from custom events
3. When logging from callbacks
4. When logging from components that handle their own navigation (e.g. TabView)
5. Outside of a React's render context

In cases where you're in a React's render context (cases 1-4 above), we still want to send the parent context properties with these events. The hook `useTrace()` returns any properties from a parent Context in case they exist:

```javascript
const parentTrace = useTrace()

const onIndexChangeTrace = (index: number) => {
  sendAnalyticsEvent(EventName.Impression, {
    section: navigationState.routes[index].key,
    ...parentTrace,
  })
  onIndexChange(index)
}
```
