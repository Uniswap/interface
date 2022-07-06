/**
 * Event names that can occur in this application.
 *
 * Subject to change as new features are added and new events are defined
 * and logged.
 */
export enum EventName {
  SWAP_SUBMITTED = 'Swap Submitted',
  PAGE_VIEWED = 'Page Viewed',
}

/**
 * User Model property operations available via Amplitude's Identify API.
 *
 * See https://www.docs.developers.amplitude.com/data/sdks/typescript-browser/#user-properties
 * for detailed documentation.
 */
export enum UserPropertyOperations {
  SET,
  SET_ONCE,
  ADD,
  ARRAY_PREPEND,
  ARRAY_APPEND,
  ARRAY_PREINSERT,
  ARRAY_POSTINSERT,
  ARRAY_REMOVE,
}
