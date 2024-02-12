import { by, device, element, expect } from 'detox'
import { ElementName } from 'src/features/telemetry/constants'

export function Swap() {
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
