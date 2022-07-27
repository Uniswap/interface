import { by, device, element } from 'detox'
import { ElementName } from '../../src/features/telemetry/constants'
import { sleep } from '../../src/utils/timing'
import { Accounts } from '../utils/fixtures'

/** Opens Account page and imports a managed account */
export async function quickOnboarding() {
  await device.setBiometricEnrollment(true)

  // open app, import existing account
  await element(by.id(ElementName.OnboardingImportWallet)).tap()
  await element(by.id(ElementName.OnboardingImportSeedPhrase)).tap()

  // enter address / eth
  await element(by.id('import_account_form/input')).typeText(Accounts.managed.seedPhrase)
  await sleep(500)
  await element(by.id(ElementName.Next)).tap()

  await element(by.id(ElementName.WalletCard + '-1')).tap()
  await element(by.id(ElementName.Next)).tap()

  // skip notifs
  await element(by.id(ElementName.Skip)).tap()

  // Face ID
  await element(by.id(ElementName.Enable)).tap()
  await device.matchFace()

  // Outro
  await element(by.id(ElementName.Next)).tap()
}

export async function maybeDismissTokenWarning() {
  try {
    await element(by.id(ElementName.TokenWarningAccept)).tap()
  } catch (e) {
    // no-op
  }
}
