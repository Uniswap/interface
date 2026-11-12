// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../index.d.ts" />

// Catalog of every runtime export in this package, grouped by purpose. Search it before writing a
// helper; the thing you need probably exists. `index.test.ts` fails when an export is missing here.
//
// Don't import from this file (lint blocks `utilities` and `utilities/src`). Import from the
// defining file instead, e.g. `utilities/src/primitives/string`. A barrel import would:
// - pull every module into the mobile bundle, since Metro doesn't tree-shake;
// - bring react-native-typed files into web-only apps' type graphs (dev-portal, mission-control);
// - make import cycles likely, as nearly every package depends on this one.

// ── Strings ──────────────────────────────────────────────────────────
export {
  chunkString, // split into fixed-size pieces
  concatStrings, // join a list as "a, b and c" with trailing text
  containsNonPrintableChars, // detect control or invisible characters
  escapeRegExp,
  normalizeTextInput, // trim, collapse whitespace, optionally lowercase
  normalizeTwitterUsername,
  SPACE_STRING,
  trimToLength, // truncate with an ellipsis
} from 'utilities/src/primitives/string'

// ── Arrays and objects ───────────────────────────────────────────────
export {
  arraysAreEqual,
  bubbleToTop, // move matching items to the front
  chunkArray, // split into fixed-size batches
  differenceWith, // items not in another array, by comparator
  getNonEmptyArrayOrThrow,
  isNonEmptyArray,
  next, // item after `current`, wrapping around (cycle)
  pickRandom, // random element, injectable RNG
  pipe, // apply a list of transforms in order
  removeDuplicatesBy, // dedupe objects by a key
  unique, // dedupe; optional custom predicate
} from 'utilities/src/primitives/array'
export {
  flattenObjectOfObjects, // values of nested records as one array
  getAllKeysOfNestedObject, // dot-path keys of a nested object
  getKeys, // typed Object.keys
  sortKeysRecursively, // stable key order, deep
  unnestObject, // flatten nested object to dot-path keys
} from 'utilities/src/primitives/objects'

// ── Numbers: parsing, validation, rounding ───────────────────────────
export {
  isNumeric,
  isSafeNumber, // finite and within MAX_SAFE_INTEGER
} from 'utilities/src/primitives/integer'
export { parseFiniteNumber } from 'utilities/src/primitives/number'
export { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'
export {
  percentFromFloat, // float to sdk-core Percent
} from 'utilities/src/format/percent'
export {
  roundForDisplay, // round to significant figures
} from 'utilities/src/format/roundForDisplay'
export { maxDecimalsReached, truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'

// ── Number, currency, and percent display formatting ─────────────────
// oxlint-disable-next-line no-restricted-imports -- cataloged only; app code uses `useLocalizationContext`
export {
  addFiatSymbolToNumber,
  formatCurrencyAmount,
  formatNumber,
  formatNumberOrString, // format a price that may be a string
  formatPercent,
  getFiatCurrencyComponents,
  getPercentNumberType,
} from 'utilities/src/format/localeBased'
export {
  clearNumberFormatCache,
  fiatGasPriceFormatter,
  fiatStandardFormatter,
  fiatTokenDetailsFormatter,
  fiatTokenPricesFormatter,
  fiatTokenQuantityFormatter,
  fiatTokenStatsFormatter,
  FiveDecimals,
  FiveDecimalsMaxTwoDecimalsMin,
  FiveDecimalsMaxTwoDecimalsMinNoCommas,
  NDecimals,
  NoDecimals,
  NoDecimalsCurrency,
  NoTrailingFourDecimalsPercentages,
  NoTrailingThreeDecimalsPercentages,
  NoTrailingTwoDecimalsPercentages,
  OneSigFigCurrency,
  portfolioBalanceFormatter,
  ShorthandNoDecimalsCurrency,
  ShorthandOneDecimal,
  ShorthandOneDecimalsCurrency,
  ShorthandTwoDecimals,
  ShorthandTwoDecimalsCurrency,
  SixDecimalsCurrency,
  SixSigFigsNoCommas,
  SixSigFigsTwoDecimals,
  SixSigFigsTwoDecimalsNoCommas,
  SmallestNumCurrency,
  StandardCurrency,
  SWAP_PRICE_COMPACT_THRESHOLD,
  swapPriceFormatter,
  swapPriceFullFormatter,
  swapTradeAmountFormatter,
  ThreeDecimals,
  ThreeDecimalsCurrency,
  ThreeSigFigsCurrency,
  TOKEN_AMOUNT_DISPLAY_FLOOR,
  tokenNonTxFormatter,
  tokenTxFormatter,
  TwoDecimals,
  TwoDecimalsCurrency,
  TYPE_TO_FORMATTER_RULES,
} from 'utilities/src/format/localeBasedFormats'
export {
  formatDotDecimalForLocale,
  getLocaleNumberSeparators,
  normalizeIntlNumberToDotDecimal,
} from 'utilities/src/format/localeNumberSeparators'
export { NumberType } from 'utilities/src/format/types'
export { getSubscriptNotationParts } from 'utilities/src/format/getSubscriptNotationParts'
export {
  parseForSubscriptNotation, // tiny numbers as 0.0₅1024 parts
  trimFractionalTrailingZeros,
} from 'utilities/src/format/parseForSubscriptNotation'
export {
  subscriptDust, // tiny positive number as subscript string
} from 'utilities/src/format/subscriptDust'
export { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
export { toSubscript } from 'utilities/src/format/toSubscript'

// ── IDs ──────────────────────────────────────────────────────────────
export { uuid } from 'utilities/src/primitives/uuid'
export { getUniqueId } from 'utilities/src/device/uniqueId'
export { uniqueIdQuery } from 'utilities/src/device/uniqueIdQuery'

// ── Async: sleep, timeouts, retries, debouncing ──────────────────────
export {
  bestEffort, // retry, then log and return null instead of throwing
} from 'utilities/src/async/bestEffort'
export { BackoffStrategy, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'
export {
  debounceCallback, // non-React debounce with cancel
  DEFAULT_DELAY,
  promiseMinDelay, // wait at least N ms (avoid loading flashes)
  promiseTimeout, // resolve null if the promise is too slow
  sleep,
} from 'utilities/src/time/timing'

// ── Time and dates ───────────────────────────────────────────────────
export {
  currentTimeInSeconds,
  HOURS_IN_DAY,
  inXMinutesUnix, // unix seconds N minutes from now
  isStale, // older than a TTL
  MAX_REACT_QUERY_CACHE_TIME_MS,
  MINUTES_IN_HOUR,
  ONE_DAY_MS,
  ONE_HOUR_MS,
  ONE_MINUTE_MS,
  ONE_SECOND_MS,
  SECONDS_IN_MINUTE,
} from 'utilities/src/time/time'
export { areSameDays } from 'utilities/src/time/date'
export {
  getDurationRemaining, // countdown parts until a timestamp
  getDurationRemainingString,
} from 'utilities/src/time/duration'
export { getRelativeAge } from 'utilities/src/time/relativeAge'

// ── Caches ───────────────────────────────────────────────────────────
export { createLruCache } from 'utilities/src/cache/lruCache'
export { createTtlCache } from 'utilities/src/cache/ttlCache'

// ── Errors and assertions ────────────────────────────────────────────
export {
  assert,
  errorToString, // unknown error to a capped message
  NotImplementedError,
  PlatformSplitStubError,
  tryCatch, // result tuple instead of try/catch, sync or async
} from 'utilities/src/errors'
export {
  isChainMismatchError,
  isConnectorDisconnectedError,
  isPreBroadcastError, // tx failed before reaching the network
  matchesCauseChain, // walk error.cause
} from 'utilities/src/errors/walletErrors'
export {
  didUserReject, // wallet request rejected by the user
  errorTextParts, // message strings from a structured error
  someInErrorChain, // walk nested error fields
  UserRejectedRequestError,
} from 'utilities/src/errors/walletRejection'

// ── JSON and serialization ───────────────────────────────────────────
export {
  jsonParse, // BigInt-safe JSON.parse
  jsonStringify, // BigInt-safe JSON.stringify
  looksLikeJson,
} from 'utilities/src/serialization/json'
export {
  canonicalStringify, // deterministic JSON, sorted keys
  serializeRequestPayload, // canonical JSON as bytes (for signing)
} from 'utilities/src/format/canonicalJson'

// ── URLs and IPFS ────────────────────────────────────────────────────
export {
  extractBaseUrl,
  extractUrlHost,
  formatDappURL, // url to short display origin
  isGifUri,
  isHttpsUri,
  isHttpUri,
  isSegmentUri,
  isSVGUri,
  sanitizeUrl,
  uriToHttpUrls,
} from 'utilities/src/format/urls'
export {
  GATEWAY_HOSTS,
  IPFS_GATEWAY_HOST,
  resolveIpfsGatewayUrl,
  uriToGatewayUrls,
} from 'utilities/src/format/gatewayUrls'
export { extractNameFromUrl } from 'utilities/src/format/extractNameFromUrl'

// ── Addresses, contracts, calldata, transactions ─────────────────────
export {
  ellipseMiddle, // shorten any string as abcd...wxyz
  shortenAddress, // truncate address for display
  shortenHash,
} from 'utilities/src/addresses'
export { isEVMAddress, isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
export { isSVMAddress } from 'utilities/src/addresses/svm/svm'
export { getContract } from 'utilities/src/contracts/getContract'
export {
  default as methodHashToFunctionSignature, // 4-byte selector to signature
} from 'utilities/src/calldata/methodHashToFunctionSignature'
export { hexlifyTransaction } from 'utilities/src/transactions/hexlifyTransaction'
export { DEFAULT_ERC20_DECIMALS } from 'utilities/src/tokens/constants'

// ── Colors ───────────────────────────────────────────────────────────
export { hexToRGB, hexToRGBString } from 'utilities/src/theme/colors'

// ── React: state, values, and refs ───────────────────────────────────
export {
  useEvent, // stable callback that sees latest props (no deps)
  useMemoCompare, // memo with custom equality
  useOnClickOutside,
  usePrevious,
} from 'utilities/src/react/hooks'
export { composeRefs, useComposedRefs } from 'utilities/src/react/composeRefs'
export {
  noop, // empty function
} from 'utilities/src/react/noop'
export { useBooleanState } from 'utilities/src/react/useBooleanState'
export {
  useHasValueBecomeTruthy, // detect falsy to truthy transition
} from 'utilities/src/react/useHasValueBecomeTruthy'
export { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'
export {
  useInitialLoadingState, // true only during first load
} from 'utilities/src/react/useInitialLoadingState'
export { useIsMounted } from 'utilities/src/react/useIsMounted'
export { usePreviousWithLayoutEffect } from 'utilities/src/react/usePreviousWithLayoutEffect'
export {
  createSemaphore, // limit concurrency (FIFO queue)
  useSemaphoreGatedValue, // release a value only when a concurrency slot frees
} from 'utilities/src/react/useSemaphoreGatedValue'
export {
  useValueAsRef, // latest value in a ref
} from 'utilities/src/react/useValueAsRef'

// ── React: timers, debounce, throttle, frame delays ──────────────────
export { useDebounce, useDebounceWithStatus, useInterval, useTimeout } from 'utilities/src/time/timing'
export { useDebouncedCallback } from 'utilities/src/react/useDebouncedCallback'
export { useThrottledCallback } from 'utilities/src/react/useThrottledCallback'
export {
  useDelayedRender, // hide content for N ms after mount
} from 'utilities/src/react/useDelayedRender'
export {
  executeWithFrameDelay, // run one action, then another N frames later
  waitFrame, // await next animation frame
} from 'utilities/src/react/delayUtils'
export {
  createUseNowMs, // useNowMs with a custom clock
  useNowMs, // current time, re-rendering every tick
} from 'utilities/src/time/useNowMs'
export {
  useSharedMachineTimeMs, // shared ticking clock for countdowns
} from 'utilities/src/time/useSharedMachineTimeMs'

// ── React: DOM, layout, events, sheets ───────────────────────────────
export { stopPropagation, stopPropagationPressProps } from 'utilities/src/react/stopPropagation'
export {
  isInsideScroller, // is a touch target inside a scrollable child
  TOUCH_DRAG_SLOP_PX,
} from 'utilities/src/react/sheetDrag'
export { markRadixEscapePreventedBySheet, useSheetEscapeToClose } from 'utilities/src/react/useSheetEscapeToClose'
export { useContainerWidth } from 'utilities/src/react/useContainerWidth'
export { useDisableBodyScroll } from 'utilities/src/react/useDisableBodyScroll'
export {
  useImmediateVisibility, // hide instantly, then run the action (exit animations)
} from 'utilities/src/react/useImmediateVisibility'
export { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
export {
  useInjectSingleStylesheet, // add a <style> once per id (web)
} from 'utilities/src/react/useInjectSingleStylesheet'
export { useIsWindowVisible } from 'utilities/src/react/useIsWindowVisible'

// ── Device: keyboard, clipboard, locale, app state, connectivity ─────
export {
  closeKeyboardBeforeCallback, // dismiss mobile keyboard, then run
  dismissNativeKeyboard,
} from 'utilities/src/device/keyboard/dismissNativeKeyboard'
export { KeyAction } from 'utilities/src/device/keyboard/types'
export { useIsKeyboardOpen } from 'utilities/src/device/keyboard/useIsKeyboardOpen'
export { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'
export { getClipboard, setClipboard, setClipboardImage } from 'utilities/src/clipboard/clipboard'
export { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
export { DEFAULT_LANGUAGE_CODE, DEFAULT_LANGUAGE_TAG } from 'utilities/src/device/constants'
export { getDeviceLocales } from 'utilities/src/device/locales'
export { useOnMobileAppState } from 'utilities/src/device/appState'
export { useIsOffline } from 'utilities/src/connection/useIsOffline'

// ── React Query ──────────────────────────────────────────────────────
export { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
export {
  hashKey, // query key hash that ignores array order
  normalizeArrays, // sort arrays in a query key
} from 'utilities/src/reactQuery/hashKey'
export {
  holdQueryResult, // report loading and hide data while `hold`
} from 'utilities/src/reactQuery/holdQueryResult'
export { isQueryLoading } from 'utilities/src/reactQuery/isQueryLoading'
export {
  persistableInfiniteQueryOptions,
  persistableQueryOptions,
} from 'utilities/src/reactQuery/persistableQueryOptions'
export {
  queryWithoutCache, // queryOptions with no stale/gc caching
} from 'utilities/src/reactQuery/queryOptions'
export { useSessionStoragePersistedQuery } from 'utilities/src/reactQuery/useSessionStoragePersistedQuery'

// ── Logging, Datadog, performance timing ─────────────────────────────
export { addErrorExtras, createLogger, getDevLogger, getLogger, logger } from 'utilities/src/logger/logger'
export { IGNORED_MESSAGES, registerConsoleOverrides } from 'utilities/src/logger/console'
export { logContextUpdate } from 'utilities/src/logger/contextEnhancer'
export {
  attachUnhandledRejectionHandler,
  logErrorToDatadog,
  logToDatadog,
  logWarningToDatadog,
  setAttributesToDatadog,
} from 'utilities/src/logger/datadog/Datadog'
export { DDRumAction, DDRumManualTiming, DDRumTiming } from 'utilities/src/logger/datadog/datadogEvents'
export { DatadogLogMetrics, logAsMetric } from 'utilities/src/logger/datadog/datadogLogMetrics'
export { DatadogEnvironment, getDatadogEnvironment } from 'utilities/src/logger/datadog/env'
export { reportAppStartTiming } from 'utilities/src/logger/datadog/reportAppStartTiming'
export { reportPerformanceTiming } from 'utilities/src/logger/reportPerformanceTiming'
export { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'

// ── Analytics and tracing ────────────────────────────────────────────
// oxlint-disable-next-line no-restricted-imports -- cataloged only; app code uses `uniswap/src/features/telemetry`
export { analytics, getAnalyticsAtomDirect } from 'utilities/src/telemetry/analytics/analytics'
export {
  captureAmplitudeTransportPayload,
  captureAnalyticsDebugEvent,
} from 'utilities/src/telemetry/analytics/analyticsDebugCapture'
export { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
export {
  ALLOW_ANALYTICS_ATOM_KEY,
  AMPLITUDE_NATIVE_TRACKING_OPTIONS,
  AMPLITUDE_SHARED_TRACKING_OPTIONS,
  ANONYMOUS_EVENT_NAMES,
  DUMMY_KEY,
} from 'utilities/src/telemetry/analytics/constants'
export { generateAnalyticsLoggers } from 'utilities/src/telemetry/analytics/logging'
export { getProcessedEvent, parseAllowAnalytics } from 'utilities/src/telemetry/analytics/utils'
export {
  AnalyticsNavigationContextProvider,
  useAnalyticsNavigationContext,
} from 'utilities/src/telemetry/trace/AnalyticsNavigationContext'
// oxlint-disable-next-line no-restricted-imports -- cataloged only; app code uses `uniswap/src/features/telemetry/Trace`
export { Trace } from 'utilities/src/telemetry/trace/Trace'
export { TraceContext, useTrace } from 'utilities/src/telemetry/trace/TraceContext'
export { getEventHandlers } from 'utilities/src/telemetry/trace/utils'
export { calculateElapsedTimeWithPerformanceMarkMs } from 'utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs'

// ── Wallet secret safety ─────────────────────────────────────────────
export {
  assertNoSecretsInPersistedSink,
  surfacePersistedSinkError,
  WalletSecretInPersistedSinkError,
} from 'utilities/src/security/persistedSinkTripwire'
export { persistedSinkTripwireMiddleware } from 'utilities/src/security/persistedSinkTripwireMiddleware'
export { useSecretMutation } from 'utilities/src/security/useSecretMutation'

// ── CI ───────────────────────────────────────────────────────────────
export { extractFailingNxTasks } from 'utilities/src/ci/logParser'

// ── Testing and Storybook ────────────────────────────────────────────
export { createMockLogger, mockLogger } from 'utilities/src/logger/mocks'
export {
  INVALID_ADDRESS_TOO_LONG,
  INVALID_ADDRESS_TOO_SHORT,
  INVALID_CHAIN_ID,
  VALID_ADDRESS,
  VALID_CHAIN_ID,
} from 'utilities/src/test/fixtures'
export {
  createThrowingProxy, // object whose methods throw, for error-path tests
  noOpFunction,
} from 'utilities/src/test/utils'
