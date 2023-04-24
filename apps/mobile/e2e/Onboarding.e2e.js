import { Create } from './usecases/Create'
import { permissions } from './utils/fixtures'

describe('Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions,
    })
  })

  describe(Create, Create)
})
