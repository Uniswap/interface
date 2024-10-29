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

export type AuthData = {
  'x-uni-address': Address
  'x-uni-timestamp': number
}
