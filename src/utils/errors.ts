export class UserRejectedRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserRejectedRequestError'
  }
}
