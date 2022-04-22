import { ImportAccounts } from './usecases/ImportAccounts'
import { permissions } from './utils/fixtures'
import { quickOnboarding } from './utils/utils'

describe('Account Setup', () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      permissions,
    })
    await quickOnboarding()
  })

  describe('Import Account', ImportAccounts)
})
