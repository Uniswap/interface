declare module 'react-native-url-polyfill' {
  import { URL as NativeURL, URLSearchParams as NativeURLSearchParams } from 'url';

  class URL extends NativeURL {}

  class URLSearchParams extends NativeURLSearchParams {}

  function setupURLPolyfill(): void;
}
