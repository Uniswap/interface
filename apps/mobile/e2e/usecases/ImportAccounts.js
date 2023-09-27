import { by, device, element, expect } from 'detox'
import { Accounts } from 'src/e2e/utils/fixtures'
import { ElementName } from 'src/features/telemetry/constants'
import { sleep } from 'utilities/src/time/timing'

export function ImportAccounts() {
  it('creates a readonly account', async () => {
    await element(by.id(ElementName.Manage)).tap()
    await element(by.id(ElementName.ImportAccount)).tap()
    await element(by.id(ElementName.AddViewOnlyWallet)).tap()

    // enter address / eth
    await element(by.id('import_account_form/input')).typeText(Accounts.readonly.address)
    await sleep(500)
    await element(by.id(ElementName.Next)).tap()

    await device.matchFace()

    // skip notifs
    await element(by.id(ElementName.Skip)).tap()

    // Outro
    await element(by.id(ElementName.Next)).tap()

    // Wait for import saga to complete
    await sleep(500)

    await expect(element(by.id(`account_item/${Accounts.readonly.address}`))).toExist()
  })

  it('creates a new managed account', async () => {
    await element(by.id(ElementName.Manage)).tap()
    await element(by.id(ElementName.ImportAccount)).tap()
    await element(by.id(ElementName.CreateAccount)).tap()

    // skip nickname
    await element(by.id(ElementName.Next)).tap()

    // skip notifs
    await element(by.id(ElementName.Skip)).tap()

    // Outro
    await element(by.id(ElementName.Next)).tap()
  })
}
