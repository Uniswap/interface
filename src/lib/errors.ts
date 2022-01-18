export class IntegrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'INTEGRATION ERROR'
  }
}

export class MissingProviderError extends IntegrationError {
  constructor() {
    super(`Missing provider`)
  }
}
