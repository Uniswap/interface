/**
 * There's a bug happening on iOS 10 where `ArrayBuffer.prototype.byteLength`
 * is not defined, but present on the object returned by the function/constructor
 * See https://github.com/charpeni/react-native-url-polyfill/issues/190
 * */

import {Platform} from 'react-native';

const majorVersionIOS = parseInt(Platform.Version, 10);

if (Platform.OS === 'ios' && majorVersionIOS === 10) {
  if (
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength') == null
  ) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(ArrayBuffer.prototype, 'byteLength', {
      configurable: true,
      enumerable: false,
      get() {
        return null;
      },
    });
  }
}
