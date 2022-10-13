<p align="center">
  <img height="60" src="https://user-images.githubusercontent.com/7189823/69501658-06047600-0ed5-11ea-8f54-952bf1afd68c.png" alt="Library's logo">
</p>

<h3 align="center">
  React Native URL Polyfill
</h3>

<p align="center">
  A lightweight and trustworthy URL polyfill for React Native
</p>

<p align="center">
  <a href="https://www.npmjs.org/package/react-native-url-polyfill">
    <img src="https://badge.fury.io/js/react-native-url-polyfill.svg" alt="Current npm package version." />
  </a>
  <a href="https://www.npmjs.org/package/react-native-url-polyfill">
    <img src="https://img.shields.io/npm/dm/react-native-url-polyfill" alt="Monthly downloads" />
  </a>
  <a href="https://circleci.com/gh/charpeni/react-native-url-polyfill">
    <img src="https://circleci.com/gh/charpeni/react-native-url-polyfill.svg?style=shield" alt="Current CircleCI build status." />
  </a>
  <a href="https://circleci.com/gh/charpeni/react-native-url-polyfill">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />
  </a>
  <a href="https://github.com/charpeni/react-native-url-polyfill/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="React Native URL Polyfill is released under the MIT license." />
  </a>
</p>

<hr />

react-native-url-polyfill is a full implementation of the WHATWG [URL Standard](https://url.spec.whatwg.org/) optimized for React Native.

- **Lightweight**. Uses a forked version of [`whatwg-url`](https://github.com/jsdom/whatwg-url) ([`whatwg-url-without-unicode`](https://github.com/charpeni/whatwg-url)) where unicode support has been stripped out — Going down from [372 KB](https://bundlephobia.com/result?p=whatwg-url@8.0.0) to [40.9 KB](https://bundlephobia.com/result?p=whatwg-url-without-unicode@8.0.0-3).
- **Trustworthy**. Follows closely the URL Standard spec, and relys on unit tests and Detox e2e tests within [React Native](https://github.com/facebook/react-native).
- **Blob support**. Supports React Native's Blob without additional steps.
- **Hermes support**. Supports [Hermes](https://github.com/facebook/hermes), a JavaScript engine optimized for running React Native on Android.

## Why do we need this?

React Native does include [a polyfill for `URL`](https://github.com/facebook/react-native/blob/8c0c860e38f57e18296f689e47dfb4a54088c260/Libraries/Blob/URL.js#L115-L222), but this polyfill is homemade — in order to keep it light-weight — and was initially created to handle specific use cases.

Meanwhile, React Native has grown around that polyfill, then some unexpected errors have arisen.

> Known issues (non-exhaustive) with React Native's URL are:
>
> - URL cannot handle "localhost" domain for base url [react-native#26019](https://github.com/facebook/react-native/issues/26019).
> - URL implementation should add a trailing slash to the base [react-native#25717](https://github.com/facebook/react-native/issues/25717).
> - URL incorrectly adds trailing slash [react-native#24428](https://github.com/facebook/react-native/issues/24428).
> - Creating an instance of URL like: `new URL('http://facebook.com')` throws an exception [react-native#16434](https://github.com/facebook/react-native/issues/16434).

Unfortunately, adding `react-native-url-polyfill` to React Native source code will means adding 📦 **74.94 KB** (as of RN 0.63) to the JavaScript bundle.

That's why you may need this external dependency. So, if you use `URL` within your app, you probably want to take a look at the installation steps below!

## Installation

First, you need to install the polyfill, which can be done with [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/).

#### Yarn

```bash
yarn add react-native-url-polyfill
```

#### npm

```bash
npm install --save react-native-url-polyfill
```

Then, the polyfill can be used in multiple ways. Pick your preferred option.

> ℹ️ To verify if the polyfill has been correctly applied, you can check if the global variable `REACT_NATIVE_URL_POLYFILL` contains the current package and version like: `react-native-url-polyfill@CURRENT_VERSION`.

### Option 1 (_Simple_)

Locate your JavaScript entry-point file, commonly called `index.js` at the root of your React Native project.

Then, import `react-native-url-polyfill/auto` at the top of your entry-point file, the polyfill will be automatically applied.

```javascript
import 'react-native-url-polyfill/auto';
```

### Option 2 (_Flexible_)

If you want to apply the polyfill when you're ready, you can import `setupURLPolyfill` and call it yourself.

> ⚠️ Metro doesn't support optional imports.
>
> If you do not apply the polyfill, it will still be added to your JavaScript bundle.
> Even if it's wrapped in a condition, Metro won't strip it in production.

```javascript
import { setupURLPolyfill } from 'react-native-url-polyfill';

setupURLPolyfill();
```

### Option 3 (_Convenient_)

If you prefer not to apply this polyfill over React Native's default `URL`, you can still import those classes manually when you want them.

```javascript
import { URL, URLSearchParams } from 'react-native-url-polyfill';

const url = new URL('https://github.com');
const searchParams = new URLSearchParams('q=GitHub');
```

## License

react-native-url-polyfill is [MIT licensed](LICENSE).
