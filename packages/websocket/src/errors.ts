/** Rejection a SubscriptionHandler uses when the server no longer knows the connection id.
 * Repeated rejections make the client replace the socket, even one that still reads OPEN. */
export class ConnectionGoneError extends Error {
  readonly connectionId: string

  constructor(connectionId: string, options?: { cause?: unknown }) {
    super('Connection not found', options)
    this.name = 'ConnectionGoneError'
    this.connectionId = connectionId
  }
}
