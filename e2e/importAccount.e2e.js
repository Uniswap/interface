const ADDRESS = '0x123196B9703eAd9037d15e87841ACef07a4DEc03'

describe('Import Account', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('readonly account', async () => {
    // TODO: remove home button tap once welcome screen is home screen
    await element(by.label('Home')).tap()
    await element(by.id('account_header/manage/button')).tap()
    await element(by.id('accounts/add/button')).tap()
    await element(by.id('import_account_form/address/field')).typeText(ADDRESS)
    await element(by.label('Track')).tap()

    await expect(element(by.id(`account_item/${ADDRESS}`))).toExist()
  })
})
