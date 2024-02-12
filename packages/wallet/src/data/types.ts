export enum NetworkErrorType {
  Forbidden = 'Forbidden',
  GatewayTimeout = 'GatewayTimeout',
  InternalServerError = 'InternalServerError',
  NotFound = 'NotFound',
  ServiceUnavailable = 'ServiceUnavailable',
  TooManyRequests = 'TooManyRequests',
  Unauthorized = 'Unauthorized',
  Unknown = 'Unknown',
}

export class NetworkError extends Error {
  constructor(message: NetworkErrorType) {
    super(message)
    this.name = 'NetworkError'
  }
}

export enum SpamCode {
  LOW = 0, // same as isSpam = false on TokenProject
  MEDIUM = 1, // same as isSpam = true on TokenProject
  HIGH = 2, // has a URL in token name
}

export type AuthData = {
  'x-uni-address': Address
  'x-uni-timestamp': number
}
