import { CreateNewWallet } from './usecases/CreateNewWallet'

describe('Onboarding', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    await device.reloadReactNative()
  })

  describe(CreateNewWallet, CreateNewWallet)
})
