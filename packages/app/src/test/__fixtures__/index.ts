import { faker } from '@faker-js/faker'

// Ensures stable fixtures
const FAKER_SEED = 123
faker.seed(FAKER_SEED)

const mockSigner = new (class {
  signTransaction = (): string => faker.finance.ethereumAddress()
  connect = (): this => this
})()

export const signerManager = {
  getSignerForAccount: async (): Promise<typeof mockSigner> => mockSigner,
}

export { faker }
