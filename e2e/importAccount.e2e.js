const READONLY_PUBLIC_ADDRESS = '0x123196b9703ead9037d15e87841acef07a4dec03'

// Test account provided by mainnet fork (10000 ETH)
const MAINNET_TEST_ACCOUNT = {
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
}

describe('Import Account', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('imports readonly account', async () => {
    // TODO: remove home button tap once welcome screen is home screen
    await element(by.label('Home')).tap()
    await element(by.id('account_header/manage/button')).tap()
    await element(by.id('accounts/add/button')).tap()
    await element(by.id('import_account_form/address/field')).typeText(READONLY_PUBLIC_ADDRESS)
    await element(by.label('Track')).tap()

    await expect(element(by.id(`account_item/${READONLY_PUBLIC_ADDRESS}`))).toExist()
  })

  it('imports local account', async () => {
    // TODO: remove home button tap once welcome screen is home screen
    await element(by.label('Home')).tap()
    await element(by.id('account_header/manage/button')).tap()
    await element(by.id('accounts/add/button')).tap()
    await element(by.id('import_account_form/mnemonic/field')).typeText(
      MAINNET_TEST_ACCOUNT.privateKey
    )
    await element(by.id('import_account_form/mnemonic/submit')).tap()

    await expect(element(by.id(`account_item/${MAINNET_TEST_ACCOUNT.address}`))).toExist()
  })
})
