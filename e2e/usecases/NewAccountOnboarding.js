import { ElementName } from '../../src/features/telemetry/constants'
import { by, expect, element, device } from 'detox'
import { sleep } from '../../src/utils/timing'

const READONLY_NAME = '@watched'
const READONLY_PUBLIC_ADDRESS = '0x123196b9703ead9037d15e87841acef07a4dec03'

// Test account provided by mainnet fork (10000 ETH)
const MAINNET_TEST_ACCOUNT = {
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  name: '@investing',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
}

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
    await element(by.id('import_account_form/input')).typeText(READONLY_PUBLIC_ADDRESS)
    await sleep(500)
    await element(by.id(ElementName.Submit)).tap()

    await device.matchFace()

    // enter account name
    await element(by.id('import_account_form/input')).typeText(READONLY_NAME)
    await element(by.id(ElementName.Submit)).tap()

    await expect(element(by.id(`account_item/${READONLY_PUBLIC_ADDRESS}`))).toExist()
  })

  it('creates a managed account', async () => {
    await element(by.id(ElementName.Import)).tap()

    // enter address / eth
    await element(by.id('import_account_form/input')).typeText(MAINNET_TEST_ACCOUNT.privateKey)
    await sleep(500)
    await element(by.id(ElementName.Submit)).tap()

    await device.matchFace()

    // enter account name
    await element(by.id('import_account_form/input')).typeText(MAINNET_TEST_ACCOUNT.name)
    await element(by.id(ElementName.Submit)).tap()

    await expect(element(by.id(`account_item/${MAINNET_TEST_ACCOUNT.address}`))).toExist()
  })
}
