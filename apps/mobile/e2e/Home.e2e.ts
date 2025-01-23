import { HomeBasicInteractions } from 'e2e/usecases/home/HomeBasicInteractions'
import { WatchWallet } from 'e2e/usecases/onboarding/WatchWallet'

describe('Home', () => {
  beforeEach(async () => {
    await device.launchApp()
    await WatchWallet()
  })

  it('tests basic home screen interactions', HomeBasicInteractions)
})
