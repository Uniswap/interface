class IntegrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'INTEGRATION ERROR'
  }
}

export const missingProviderError = new IntegrationError('Missing provider')
