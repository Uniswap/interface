import { ElementName } from '../../src/features/telemetry/constants'
import { by, expect, element, device } from 'detox'
import { sleep } from '../../src/utils/timing'
import { Accounts } from '../utils/fixtures'

export function NewAccountOnboarding() {
  beforeAll(async () => {
    // await device.terminateApp()
    await device.launchApp({
      delete: true,
      permissions: { faceid: 'YES' },
    })
    await device.setBiometricEnrollment(true)
  })

  it('creates a readonly account', async () => {
    await element(by.id(ElementName.Manage)).tap()
    await element(by.id(ElementName.Import)).tap()

    // enter address / eth
    await element(by.id('import_account_form/input')).typeText(Accounts.readonly.address)
    await sleep(500)
    await element(by.id(ElementName.Submit)).tap()

    await device.matchFace()

    // enter account name
    await element(by.id('import_account_form/input')).typeText(Accounts.readonly.name)
    await element(by.id(ElementName.Submit)).tap()

    await expect(element(by.id(`account_item/${Accounts.readonly.address}`))).toExist()
  })

  it('creates a managed account', async () => {
    await element(by.id(ElementName.Import)).tap()

    // enter address / eth
    await element(by.id('import_account_form/input')).typeText(Accounts.managed.privateKey)
    await sleep(500)
    await element(by.id(ElementName.Submit)).tap()

    await device.matchFace()

    // enter account name
    await element(by.id('import_account_form/input')).typeText(Accounts.managed.name)
    await element(by.id(ElementName.Submit)).tap()

    await expect(element(by.id(`account_item/${Accounts.managed.address}`))).toExist()
  })
}
