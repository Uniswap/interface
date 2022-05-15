import { ElementName } from '../../src/features/telemetry/constants'
import { by, expect, element, device } from 'detox'
import { sleep } from '../../src/utils/timing'

export function Swap() {
  it('fills the swap form', async () => {
    await element(by.id(ElementName.NavigateSwap)).tap()

    await element(by.id('currency-selector-toggle-in')).tap()
    await element(by.id('currency-option-1-ETH')).tap()

    await element(by.id('currency-selector-toggle-out')).tap()
    await element(by.id('currency-option-1-DAI')).tap()

    // type 1.23
    await element(by.id('decimal-pad-1')).tap()
    await element(by.id('decimal-pad-.')).tap()
    await element(by.id('decimal-pad-2')).tap()
    await element(by.id('decimal-pad-.')).tap() // should be ignored
    await element(by.id('decimal-pad-0')).tap()
    await element(by.id('decimal-pad-←')).tap()
    await element(by.id('decimal-pad-3')).tap()

    // TODO: mock routing api request
    // wait for routing api
    await sleep(5000)
  })

  it('submit a swap tx', async () => {
    await element(by.id(ElementName.Swap)).longPress(2000)

    await device.matchFace()
  })

  it('validates swap response', async () => {
    await expect(element(by.id('toast-success'))).toBeVisible()
  })
}
