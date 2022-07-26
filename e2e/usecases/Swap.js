import { by, device, element, expect } from 'detox'
import { ElementName } from '../../src/features/telemetry/constants'
import { sleep } from '../../src/utils/timing'
import { maybeDismissTokenWarning } from '../utils/utils'

export function Swap() {
  it('fills the swap form', async () => {
    await element(by.id(ElementName.NavigateSwap)).tap()

    await element(by.id('currency-selector-toggle-in')).tap()
    await element(by.id('currency-option-1-ETH')).tap()

    await maybeDismissTokenWarning()

    await element(by.id('currency-selector-toggle-out')).tap()
    await element(by.id('currency-option-1-1INCH')).tap()

    await maybeDismissTokenWarning()

    // type 7.23
    await element(by.id('decimal-pad-7')).tap()
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

  it('saves the original amount on usd toggle', async () => {
    await element(by.id('toggle-usd')).tap()
    await element(by.id('toggle-usd')).tap()
    await expect(element(by.id('amount-input-in'))).toHaveText('1.23')
  })

  it('submit a swap tx', async () => {
    await element(by.id(ElementName.ReviewSwap)).tap()
    await element(by.id(ElementName.Swap)).tap()
    await device.matchFace()

    await element(by.id(ElementName.OK)).tap()
  })
}
