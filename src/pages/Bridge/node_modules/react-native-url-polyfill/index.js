import './js/ios10Fix';

import {polyfillGlobal} from 'react-native/Libraries/Utilities/PolyfillFunctions';

import {name, version} from './package.json';

export * from './js/URL';
export * from './js/URLSearchParams';

export function setupURLPolyfill() {
  global.REACT_NATIVE_URL_POLYFILL = `${name}@${version}`;

  polyfillGlobal('URL', () => require('./js/URL').URL);
  polyfillGlobal(
    'URLSearchParams',
    () => require('./js/URLSearchParams').URLSearchParams,
  );
}
