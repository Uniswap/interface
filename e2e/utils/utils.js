import { Accounts } from '../utils/fixtures'
import { ElementName } from '../../src/features/telemetry/constants'
import { device, element, by } from 'detox'
import { sleep } from '../../src/utils/timing'

/** Opens Account page and imports a managed account */
export async function quickOnboarding() {
  await device.setBiometricEnrollment(true)

  // open app, open account drawer, and start import flow
  await element(by.id(ElementName.OnboardingExplore)).tap()
  await sleep(500) // wait for account activation
  await element(by.id(ElementName.Manage)).tap()
  await element(by.id(ElementName.ImportAccount)).tap()

  // enter address / eth
  await element(by.id('import_account_form/input')).typeText(Accounts.managed.privateKey)
  await sleep(500)
  await element(by.id(ElementName.Submit)).tap()
  await sleep(500) // wait for account activation

  await device.matchFace()

  // enter account name
  await element(by.id('import_account_form/input')).typeText(Accounts.managed.name)
  await element(by.id(ElementName.Submit)).tap()
}

export async function maybeDismissTokenWarning() {
  try {
    await element(by.id(ElementName.TokenWarningAccept)).tap()
  } catch (e) {
    // no-op
  }
}
