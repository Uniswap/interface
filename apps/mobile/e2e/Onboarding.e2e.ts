import { CreateNewWallet } from 'e2e/usecases/onboarding/CreateNewWallet'
import { WatchWallet } from 'e2e/usecases/onboarding/WatchWallet'

describe('Onboarding', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true })
  })

  afterEach(async () => {
    await device.uninstallApp()
    await device.installApp()
  })

  it('creates a new wallet', CreateNewWallet)
  it('watches wallet', WatchWallet)
  // TODO: find the way to test native input
  // eslint-disable-next-line jest/no-commented-out-tests
  // it('imports a testing wallet using recovery phrase', ImportWallet)
})
