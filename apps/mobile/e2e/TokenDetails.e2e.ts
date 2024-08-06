import { WatchWallet } from 'e2e/usecases/onboarding/WatchWallet'
import { TokenDetailsBasicInteractions } from 'e2e/usecases/tokenDetails/TokenDetailsBasicInteractions'

describe('TokenDetails', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    await WatchWallet()
  })

  it('tests token details screen interactions', TokenDetailsBasicInteractions)
})
