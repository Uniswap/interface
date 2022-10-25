export enum NetworkErrorType {
  Forbidden = 'Forbidden',
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
