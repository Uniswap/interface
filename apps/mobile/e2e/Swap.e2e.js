import { Swap } from './usecases/Swap'
import { permissions } from './utils/fixtures'
import { quickOnboarding } from './utils/utils'

describe('Swap', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions,
    })

    await quickOnboarding()
  })

  describe(Swap, Swap)
})
