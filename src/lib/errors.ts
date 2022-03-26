export class IntegrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Integration Error'
  }
}
