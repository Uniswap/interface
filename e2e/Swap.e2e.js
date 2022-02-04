import { Swap } from './usecases/Swap'
import { quickOnboarding } from './utils/utils'

describe('Swap', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions: { faceid: 'YES' },
    })

    await quickOnboarding()
  })

  describe(Swap, Swap)
})
