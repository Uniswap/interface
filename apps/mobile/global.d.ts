/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The global chrome object is not available at runtime in mobile but is
 * required for TypeScript compilation due to its use in the utilities package
 */
declare let chrome: {
  runtime: any
  [key: string]: any
}
