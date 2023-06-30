const serializeError = (error: unknown): string =>
  JSON.stringify(error, Object.getOwnPropertyNames(error))

export default serializeError
