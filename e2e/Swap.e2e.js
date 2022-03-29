import { Swap } from './usecases/Swap'
import { quickOnboarding } from './utils/utils'
import { permissions } from './utils/fixtures'

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
