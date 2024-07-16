import { faker } from '@faker-js/faker'

export const MAX_FIXTURE_TIMESTAMP = 1609459200

const FAKER_SEED = 123

faker.seed(FAKER_SEED)

export { faker }
