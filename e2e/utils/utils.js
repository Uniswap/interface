import { by, device, element } from 'detox'
import { ElementName } from '../../src/features/telemetry/constants'
import { sleep } from '../../src/utils/timing'
import { Accounts } from '../utils/fixtures'

/** Opens Account page and imports a managed account */
export async function quickOnboarding() {
  await device.setBiometricEnrollment(true)

  // open app, import existing account
  await element(by.id(ElementName.OnboardingImportWallet)).tap()
  await element(by.id(ElementName.OnboardingImportPrivateKey)).tap()

  // enter address / eth
  await element(by.id('import_account_form/input')).typeText(Accounts.managed.privateKey)
  await sleep(500)
  await element(by.id(ElementName.Submit)).tap()

  // skip nickname
  await element(by.id(ElementName.Next)).tap()

  // Choose a color
  await element(by.id(ElementName.SelectColor + '-' + '#FC72FF')).tap()
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
