import { ElementName } from '../../src/features/telemetry/constants'
import { by, expect, element, device } from 'detox'
import { sleep } from '../../src/utils/timing'

export function Swap() {
  beforeAll(async () => {
    await device.setBiometricEnrollment(true)
  })

  it('fills the swap form', async () => {
    await element(by.id(ElementName.TabBarSwap)).tap()

    await element(by.id('amount-input-in')).typeText('1')

    await element(by.id('currency-selector-toggle-in')).tap()
    await element(by.id('currency-option-ETH')).tap()

    await element(by.id('currency-selector-toggle-out')).tap()
    await element(by.id('currency-option-DAI')).tap()

    // TODO: mock routing api request
    // wait for routing api
    await sleep(5000)
  })

  it('submit a swap tx', async () => {
    await element(by.id(ElementName.Swap)).tap()

    await device.matchFace()
  })

  it('validates swap response', async () => {
    await expect(element(by.id('toast-success'))).toBeVisible()
  })
}
