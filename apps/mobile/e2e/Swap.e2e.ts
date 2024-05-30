import { WatchWallet } from 'e2e/usecases/onboarding/WatchWallet'
import { SwapBasicInteractions } from 'e2e/usecases/swap/SwapBasicInteractions'

describe('Swap', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
    await WatchWallet()
  })

  it('tests swap screen interactions', SwapBasicInteractions)
})
