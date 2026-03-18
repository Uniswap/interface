// biome-ignore-all lint/suspicious/noExplicitAny: required here
/**
 * The global chrome object is not available at runtime in mobile but is
 * required for TypeScript compilation due to its use in the utilities package
 */
declare let chrome: {
  runtime: any
  [key: string]: any
}

/**
 * Module augmentation to @datadog deep import for tsgo compatibility
 */
declare module '@datadog/mobile-react-native/lib/typescript/rum/eventMappers/errorEventMapper' {
  export type ErrorEventMapper = (event: any) => any | null
}
