import { CreateNewWallet } from 'e2e/usecases/onboarding/CreateNewWallet'
import { ImportWallet } from 'e2e/usecases/onboarding/ImportWallet'
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
  it('imports a testing wallet using recovery phrase', ImportWallet)
})
