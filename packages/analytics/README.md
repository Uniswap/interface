# Ubeswap Analytics

React components and functions used to provide Analytics capability to Ubeswap. This is forked from `@uniswap/analytics`.

This package is intended to be used with the `@ubeswap/analytics-events` package, which provides the constant definitions used inside this package.

## Installation

Install via `npm` or `yarn`.

```js
yarn add @ubeswap/analytics
```
```js
npm i --save @ubeswap/analytics
```

Make sure the environment variable `REACT_APP_STAGING` is set to `false` in production.

## Development

When making changes to this package, first ensure your changes are designed as needed by installing your changes from a tarball. To generate the tarball (with version `0.0.1` to indicate a test version) use the following command:

```bash
yarn tarball
```

To install in the relevant repo, copy the tarball to the root of your project's `package.json` and run the following commands in your project's root:

```bash
# yarn
yarn cache clean
yarn add file:ubeswap-analytics-dev.tgz

# npm
npm install ubeswap-analytics-dev.tgz
```

Alternatively, you can install with a direct file reference from your local `analytics` repository.

Once you have verified your changes, submit a PR, merge your code, and install the package directly from npm to pick up the official changes.

## Release

Releasing is performed manually using the [release](/.github/workflows/release.yaml) Github workflow.

This repository uses [semantic-release](https://github.com/semantic-release/semantic-release) for the release process,
which in turn uses the [Angular commit message suggestions](https://github.com/angular/angular/blob/main/CONTRIBUTING.md) to identify the type of release.


## Documentation

### Initializing Analytics

The client should be initialized before it is used. To initialize the client, pass in the API key of the application, as well as the name of
the application. If the application name is not listed under `OriginApplication`, it should be added under the enum. An additional
configuration object can be passed.

```js
import { initializeAnalytics, OriginApplication } from '@ubeswap/analytics'

initializeAnalytics(MY_API_KEY, OriginApplication.INTERFACE, {
    proxyUrl: MY_PROXY_URL
})
```
Note that an `Error` is thrown if the client is initialized more than once or if an invalid configuration object is provided.

#### Configuration Options

| Option             | Type             | Description                                                                                  |
| :----------------- | :--------------- | :------------------------------------------------------------------------------------------- |
| `proxyUrl`         | string           | The Amplitude URL to send events to.                                                         |
| `defaultEventName` | string           | When an event name is not provided, use the provided default. Defaults to `Page Viewed`.     |
| `commitHash`       | string           | The git commit hash to send with Trace events only. Does not send by default on raw events.  |
| `isProductionEnv`  | boolean          | When not set to true, user properties are not set on the Amplitude client.                   |
| `debug`            | boolean          | When enabled, logs events to the console. Cannot be enabled while `isProductionEnv` is true. |
| `setOriginCountry` | (string) => void | Executes on the first `send` function that is called. The `Origin-Country` response header is passed as the argument. |

### Logging Events Directly

Before logging an event, make sure to add it under the `EventName` enum in the `@ubeswap/analytics-events` package. To log an analytics event:
```js
import { sendAnalyticsEvent } from '@ubeswap/analytics'
import { EventName, ElementName } from '@ubeswap/analytics-events'

sendAnalyticsEvent(EventName.PAGE_CLICKED, {
    elementName: ElementName.TOP_MENU
})
```

### Using the Trace Component

There is also a built in React component that logs an event when it is first mounted. You may use it as a wrapper:
```js
import { Trace } from '@ubeswap/analytics'
import { EventName, ModalName } from '@ubeswap/analytics-events'


<Trace name={EventName.TOKEN_SELECTOR_OPENED} modal={ModalName.TOKEN_SELECTOR}>
    <SomeComponent/>
</Trace>
```
Depending on the context that `<Trace/>` is used in, you may have to define new values in `@ubeswap/analytics-events` for the enums that are passed in as arguments such: `BrowserEvent`, `EventName`, `ModalName`, `ElementName`.

There is a React component that wraps event callbacks with logging logic:
```js
import { TraceEvent } from '@ubeswap/analytics'
import { EventName, ElementName } from '@ubeswap/analytics-events'

<TraceEvent events={[Event.onClick]} name={EventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED} element={ElementName.MAX_TOKEN_AMOUNT_BUTTON}>
    <SomeButton onClick={onClickHandler}/>
</TraceEvent>
``` 

Finally, you can set properties about the user of the application:
```js
import { user } from 'analytics'
import { CustomUserProperties } from '@ubeswap/analytics-events'

user.set(CUSTOM_USER_PROPERTIES.DARK_MODE, isDarkMode)
```
