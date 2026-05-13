export { getChrome, getChromeRuntime, getChromeRuntimeWithThrow, getChromeWithThrow } from './chrome'
export { Environment, NodeEnv } from '@universe/config'
export {
  BUNDLE_ID,
  isBetaEnv,
  isDatadogEnabled,
  isDevEnv,
  isE2eTestEnv,
  isProdEnv,
  isUnitTestEnv,
  isRNDev,
  isTestEnv,
  localDevDatadogEnabled,
} from './environment/env'
export { TRUSTED_CHROME_EXTENSION_IDS } from './environment/extensionId'
export { getCurrentEnv } from './environment/getCurrentEnv'
export {
  isAndroid,
  isChrome,
  isExtensionApp,
  isHoverable,
  isIOS,
  isMobileApp,
  isMobileWeb,
  isMobileWebAndroid,
  isMobileWebSafari,
  isSafari,
  isTouchable,
  isWebAndroid,
  isWebApp,
  isWebAppDesktop,
  isWebIOS,
  isWebPlatform,
} from './platform'
export { PlatformSplitStubError } from './platform/PlatformSplitStubError'
export { REQUEST_SOURCE } from './platform/requestSource'
