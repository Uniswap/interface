export class IntegrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Integration Error'
  }
}

export class ChainIdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Unsupported network'
  }
}
