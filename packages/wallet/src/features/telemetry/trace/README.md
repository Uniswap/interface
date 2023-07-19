# Trace

The Trace component has the ability to log events on impression and press, as well as setting context metadata for all child Trace components to consume.

```typescript
<Trace screen={Screens.Home} section={SectionName.ExploreSearch}>
  {children}
</Trace>
```

`properties`: Extra properties to send with an impression event. e.g. Token Details Screen:

`<Trace screen={Screens.TokenDetails} properties={{tokenAddress: address, tokenName: name}}>`

## Logging Impressions

Impressions are logged with the logImpression property and will capture all surrounding context. Additional event properties beyond the TraceContext can be set using the `properties` prop.

```typescript
<Trace logImpression properties={{prop: value}}>
  {children}
</Trace>
```

## Logging Presses

Presses are logged with the logPress property and will capture all surrounding context. Additional event properties beyond the TraceContext can be set using the `properties` prop.

```typescript
<Trace logPress properties={{prop: value}}>
  {children}
</Trace>
```

If you would like to log a different event than the default event, pass the custom event name using the `pressEvent` property.

```typescript
<Trace logPress pressEvent={MobileEventName.FiatOnRampWidgetOpened}>
  {children}
</Trace>
```
