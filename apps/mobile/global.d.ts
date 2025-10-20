// biome-ignore-all lint/suspicious/noExplicitAny: required here
/**
 * The global chrome object is not available at runtime in mobile but is
 * required for TypeScript compilation due to its use in the utilities package
 */
declare let chrome: {
  runtime: any
  [key: string]: any
}
